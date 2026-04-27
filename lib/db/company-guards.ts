import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { AppError } from "@/lib/utils/http";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
}

async function findAuthUserByEmail(email: string) {
  const admin = createAdminSupabaseClient();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new AppError("Unable to verify whether the support email is available.", 500);
    }

    const match = data.users.find((user) => user.email?.toLowerCase() === email);

    if (match) {
      return match;
    }

    if (!data.nextPage || data.users.length < perPage) {
      return null;
    }

    page = data.nextPage;
  }
}

export async function assertCompanySlugAvailable(options: {
  companyId?: string | null;
  slug: string;
}) {
  const admin = createAdminSupabaseClient();
  const normalizedSlug = normalizeSlug(options.slug);
  const { data, error } = await admin
    .from("companies")
    .select("id, name, slug")
    .eq("slug", normalizedSlug)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError("Unable to verify whether the company slug is available.", 500);
  }

  if (data && data.id !== options.companyId) {
    throw new AppError("This company slug is already in use. Choose a different slug.", 409);
  }
}

export async function assertCompanySupportEmailAvailable(options: {
  companyId?: string | null;
  supportEmail: string;
  allowExistingUserId?: string | null;
}) {
  const admin = createAdminSupabaseClient();
  const normalizedEmail = normalizeEmail(options.supportEmail);

  const [{ data: companyConflict, error: companyError }, { data: profileConflict, error: profileError }, authConflict] =
    await Promise.all([
      admin
        .from("companies")
        .select("id, name, support_email")
        .eq("support_email", normalizedEmail)
        .limit(1)
        .maybeSingle(),
      admin
        .from("users")
        .select("id, email")
        .eq("email", normalizedEmail)
        .limit(1)
        .maybeSingle(),
      findAuthUserByEmail(normalizedEmail),
    ]);

  if (companyError || profileError) {
    throw new AppError("Unable to verify whether the support email is available.", 500);
  }

  if (companyConflict && companyConflict.id !== options.companyId) {
    throw new AppError(
      "This support email is already assigned to another company. Use a dedicated support email for this company.",
      409,
    );
  }

  if (profileConflict && profileConflict.id !== options.allowExistingUserId) {
    throw new AppError(
      "This support email already belongs to an existing account. Use a different support email so the first admin setup can complete.",
      409,
    );
  }

  if (authConflict && authConflict.id !== options.allowExistingUserId) {
    throw new AppError(
      "This support email already belongs to an existing account. Use a different support email so the first admin setup can complete.",
      409,
    );
  }
}

export async function assertPlatformCompanyIdentityAvailable(options: {
  companyId?: string | null;
  slug: string;
  supportEmail: string;
  allowExistingUserId?: string | null;
}) {
  await Promise.all([
    assertCompanySlugAvailable({
      companyId: options.companyId,
      slug: options.slug,
    }),
    assertCompanySupportEmailAvailable({
      allowExistingUserId: options.allowExistingUserId,
      companyId: options.companyId,
      supportEmail: options.supportEmail,
    }),
  ]);
}
