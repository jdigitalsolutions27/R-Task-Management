import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { assertPlatformCompanyIdentityAvailable } from "@/lib/db/company-guards";
import { dispatchCompanyOnboardingAction } from "@/lib/db/company-onboarding";
import { AppError } from "@/lib/utils/http";
import type { Company, UserProfile } from "@/types/app";
import type { CompanySettingsInput } from "@/lib/validation/schemas";

export interface PlatformOverviewMetrics {
  companies: number;
  pendingUsers: number;
  supportTickets: number;
  totalUsers: number;
}

export interface PlatformUserRecord extends UserProfile {
  company: Pick<Company, "id" | "logo_url" | "name" | "slug"> | null;
}

export async function getPlatformOverviewMetrics(): Promise<PlatformOverviewMetrics> {
  const admin = createAdminSupabaseClient();
  const [companies, pendingUsers, supportTickets, totalUsers] = await Promise.all([
    admin.from("companies").select("*", { count: "exact", head: true }),
    admin.from("users").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .eq("target_level", "platform_admin")
      .is("archived_at", null)
      .neq("status", "resolved"),
    admin.from("users").select("*", { count: "exact", head: true }),
  ]);

  const errors = [companies.error, pendingUsers.error, supportTickets.error, totalUsers.error].filter(Boolean);

  if (errors.length) {
    throw new AppError("Unable to load platform overview.", 500);
  }

  return {
    companies: companies.count ?? 0,
    pendingUsers: pendingUsers.count ?? 0,
    supportTickets: supportTickets.count ?? 0,
    totalUsers: totalUsers.count ?? 0,
  };
}

export async function listPlatformCompanies() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("Unable to load companies.", 500);
  }

  return data;
}

export async function listPlatformUsers(): Promise<PlatformUserRecord[]> {
  const admin = createAdminSupabaseClient();
  const [{ data: users, error: usersError }, { data: companies, error: companiesError }] = await Promise.all([
    admin.from("users").select("*").order("created_at", { ascending: false }),
    admin.from("companies").select("id, logo_url, name, slug"),
  ]);

  if (usersError || companiesError) {
    throw new AppError("Unable to load platform users.", 500);
  }

  const companyMap = new Map((companies ?? []).map((company) => [company.id, company]));

  return (users ?? []).map((user) => ({
    ...user,
    company: user.company_id ? companyMap.get(user.company_id) ?? null : null,
  }));
}

export async function createPlatformCompany(input: CompanySettingsInput, actorId?: string | null) {
  const admin = createAdminSupabaseClient();
  const normalizedSlug = input.slug.trim().toLowerCase();
  const normalizedSupportEmail = input.supportEmail.trim().toLowerCase();
  await assertPlatformCompanyIdentityAvailable({
    slug: normalizedSlug,
    supportEmail: normalizedSupportEmail,
  });
  const { data, error } = await admin
    .from("companies")
    .insert({
      background_color: input.backgroundColor,
      invite_approval_required: input.inviteApprovalRequired,
      logo_url: input.logoUrl || null,
      name: input.name,
      primary_color: input.primaryColor,
      secondary_color: input.secondaryColor,
      status: "pending_verification",
      slug: normalizedSlug,
      support_email: normalizedSupportEmail,
    })
    .select("*")
    .single();

  if (error) {
    throw new AppError("Unable to create the company.", 500);
  }

  const onboarding = await dispatchCompanyOnboardingAction({
    companyId: data.id,
    action: "send_verification",
    actorId,
  });

  return {
    company: data,
    onboarding,
  };
}

export async function updatePlatformCompany(companyId: string, input: CompanySettingsInput, actorId?: string | null) {
  const admin = createAdminSupabaseClient();
  const normalizedSlug = input.slug.trim().toLowerCase();
  const normalizedSupportEmail = input.supportEmail.trim().toLowerCase();
  const { data: existing, error: existingError } = await admin
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (existingError || !existing) {
    throw new AppError("Unable to load the company record.", 404);
  }

  await assertPlatformCompanyIdentityAvailable({
    allowExistingUserId: existing.first_admin_user_id,
    companyId,
    slug: normalizedSlug,
    supportEmail: normalizedSupportEmail,
  });

  const shouldResetVerification =
    !existing.first_admin_user_id &&
    (existing.support_email !== normalizedSupportEmail || existing.slug !== normalizedSlug);

  const { data, error } = await admin
    .from("companies")
    .update({
      background_color: input.backgroundColor,
      invite_approval_required: input.inviteApprovalRequired,
      logo_url: input.logoUrl || null,
      name: input.name,
      primary_color: input.primaryColor,
      secondary_color: input.secondaryColor,
      status: shouldResetVerification ? "pending_verification" : existing.status,
      slug: normalizedSlug,
      support_email: normalizedSupportEmail,
      support_email_verification_sent_at: shouldResetVerification ? null : existing.support_email_verification_sent_at,
      support_email_verified_at: shouldResetVerification ? null : existing.support_email_verified_at,
      activated_at: shouldResetVerification ? null : existing.activated_at,
    })
    .eq("id", companyId)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Unable to update the company.", 500);
  }

  const onboarding =
    shouldResetVerification
      ? await dispatchCompanyOnboardingAction({
          companyId: data.id,
          action: "send_verification",
          actorId,
        })
      : null;

  return {
    company: data,
    onboarding,
  };
}

export async function deletePlatformCompany(companyId: string) {
  const admin = createAdminSupabaseClient();
  const dependencyTables = [
    "users",
    "properties",
    "files",
    "inspections",
    "reports",
    "evictions",
    "support_tickets",
    "company_invite_codes",
  ] as const;

  const checks = await Promise.all(
    dependencyTables.map((table) =>
      admin.from(table).select("*", { count: "exact", head: true }).eq("company_id", companyId),
    ),
  );

  const errors = checks.map((result) => result.error).filter(Boolean);
  if (errors.length) {
    throw new AppError("Unable to verify company dependencies.", 500);
  }

  const hasDependencies = checks.some((result) => (result.count ?? 0) > 0);

  if (hasDependencies) {
    throw new AppError(
      "This company already has users or operational records. Remove the linked data before deleting it.",
      409,
    );
  }

  const { error } = await admin.from("companies").delete().eq("id", companyId);

  if (error) {
    throw new AppError("Unable to delete the company.", 500);
  }
}

export async function updatePlatformUser(
  userId: string,
  input: {
    actorId: string;
    role: UserProfile["role"];
    status: UserProfile["status"];
  },
) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("users")
    .update({
      approved_at: input.status === "approved" ? new Date().toISOString() : null,
      approved_by: input.status === "approved" || input.status === "rejected" ? input.actorId : null,
      role: input.role,
      status: input.status,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Unable to update the user.", 500);
  }

  let company: PlatformUserRecord["company"] = null;

  if (data.company_id) {
    const { data: companyData, error: companyError } = await admin
      .from("companies")
      .select("id, logo_url, name, slug")
      .eq("id", data.company_id)
      .single();

    if (companyError) {
      throw new AppError("Unable to load the updated company details.", 500);
    }

    company = companyData;
  }

  return {
    ...data,
    company,
  };
}
