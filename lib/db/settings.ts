import { randomBytes } from "node:crypto";

import {
  assertCapabilityContext,
  assertCompanyContext,
  type SessionContext,
} from "@/lib/db/context";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { notifyCompanyUsers } from "@/lib/db/notifications";
import { AppError } from "@/lib/utils/http";
import type {
  InviteCodeInput,
  TenantCompanySettingsInput,
} from "@/lib/validation/schemas";

function generateInviteCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function listCompanyUsers(context: SessionContext) {
  assertCapabilityContext(context, "settings:view");
  const company = assertCompanyContext(context);

  const { data, error } = await context.supabase
    .from("users")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("Unable to load company users.", 500);
  }

  return data;
}

export async function updateCompanySettings(
  context: SessionContext,
  input: TenantCompanySettingsInput,
) {
  assertCapabilityContext(context, "settings:manage");
  const company = assertCompanyContext(context);

  const { data, error } = await context.supabase
    .from("companies")
    .update({
      background_color: input.backgroundColor,
      invite_approval_required: input.inviteApprovalRequired,
      logo_url: input.logoUrl || null,
      primary_color: input.primaryColor,
      secondary_color: input.secondaryColor,
    })
    .eq("id", company.id)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Unable to update company settings.", 500);
  }

  return data;
}

export async function listInviteCodes(context: SessionContext) {
  assertCapabilityContext(context, "settings:view");
  const company = assertCompanyContext(context);

  const { data, error } = await context.supabase
    .from("company_invite_codes")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("Unable to load invite codes.", 500);
  }

  return data;
}

export async function createInviteCode(
  context: SessionContext,
  input: InviteCodeInput,
) {
  assertCapabilityContext(context, "settings:manage");
  const company = assertCompanyContext(context);

  const { data, error } = await context.supabase
    .from("company_invite_codes")
    .insert({
      active: input.active,
      code: generateInviteCode(),
      company_id: company.id,
      created_by: context.profile.id,
      expires_at: input.expiresAt || null,
      max_uses: input.maxUses ?? null,
      role: input.role,
    })
    .select("*")
    .single();

  if (error) {
    throw new AppError("Unable to create the invite code.", 500);
  }

  return data;
}

export async function deactivateInviteCode(
  context: SessionContext,
  inviteId: string,
) {
  assertCapabilityContext(context, "settings:manage");
  const company = assertCompanyContext(context);

  const { error } = await context.supabase
    .from("company_invite_codes")
    .update({ active: false })
    .eq("id", inviteId)
    .eq("company_id", company.id);

  if (error) {
    throw new AppError("Unable to deactivate the invite code.", 500);
  }
}

export async function reviewCompanyUser(
  context: SessionContext,
  userId: string,
  decision: "approved" | "rejected",
  role?: "corporate_user" | "employee" | "inspector",
) {
  assertCapabilityContext(context, "users:approve");
  const company = assertCompanyContext(context);

  const payload = {
    approved_at: decision === "approved" ? new Date().toISOString() : null,
    approved_by: context.profile.id,
    role: role ?? undefined,
    status: decision,
  };

  const { data, error } = await context.supabase
    .from("users")
    .update(payload)
    .eq("id", userId)
    .eq("company_id", company.id)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Unable to review the company user.", 500);
  }

  await notifyCompanyUsers({
    actionLabel: "Open Dashboard",
    actionPath: "/dashboard",
    companyId: company.id,
    detail:
      decision === "approved"
        ? "Your account has been approved."
        : "Your account request was rejected.",
    eventType: decision === "approved" ? "user_approved" : "user_rejected",
    message:
      decision === "approved"
        ? "Your account is active and ready to use."
        : "Please contact your company administrator for assistance.",
    recipientUserIds: [userId],
    title: decision === "approved" ? "Account approved" : "Account rejected",
  });

  return data;
}

export async function manageCompanyUser(
  context: SessionContext,
  input: {
    action: "approve" | "reject" | "lock" | "unlock";
    role?: "corporate_user" | "employee" | "inspector";
    userId: string;
  },
) {
  assertCapabilityContext(context, "users:approve");
  const company = assertCompanyContext(context);

  if (context.profile.id === input.userId && (input.action === "lock" || input.action === "reject")) {
    throw new AppError("You cannot lock or reject your own signed-in account.", 409);
  }

  const nextStatus: "approved" | "rejected" =
    input.action === "approve" || input.action === "unlock" ? "approved" : "rejected";
  const actionCopy = {
    approve: {
      detail: "Your account has been approved.",
      eventType: "user_approved" as const,
      message: "Your account is active and ready to use.",
      title: "Account approved",
    },
    lock: {
      detail: "Your account has been locked by the company admin.",
      eventType: "user_rejected" as const,
      message: "Please contact your company administrator for assistance.",
      title: "Account locked",
    },
    reject: {
      detail: "Your account request was rejected.",
      eventType: "user_rejected" as const,
      message: "Please contact your company administrator for assistance.",
      title: "Account rejected",
    },
    unlock: {
      detail: "Your account has been reactivated.",
      eventType: "user_approved" as const,
      message: "Your account can be used again.",
      title: "Account unlocked",
    },
  }[input.action];

  const payload = {
    approved_at: nextStatus === "approved" ? new Date().toISOString() : null,
    approved_by: context.profile.id,
    role: input.role ?? undefined,
    status: nextStatus,
  };

  const { data, error } = await context.supabase
    .from("users")
    .update(payload)
    .eq("id", input.userId)
    .eq("company_id", company.id)
    .neq("role", "platform_admin")
    .select("*")
    .single();

  if (error) {
    throw new AppError("Unable to update the company user.", 500);
  }

  await notifyCompanyUsers({
    actionLabel: "Open Dashboard",
    actionPath: "/dashboard",
    companyId: company.id,
    detail: actionCopy.detail,
    eventType: actionCopy.eventType,
    message: actionCopy.message,
    recipientUserIds: [input.userId],
    title: actionCopy.title,
  });

  return data;
}

export async function deleteCompanyUser(context: SessionContext, userId: string) {
  assertCapabilityContext(context, "users:approve");
  const company = assertCompanyContext(context);

  if (context.profile.id === userId) {
    throw new AppError("You cannot delete your own account while signed in.", 409);
  }

  const admin = createAdminSupabaseClient();
  const { data: targetUser, error: targetError } = await admin
    .from("users")
    .select("id, company_id, role")
    .eq("id", userId)
    .single();

  if (targetError || !targetUser) {
    throw new AppError("Unable to find that company user.", 404);
  }

  if (targetUser.company_id !== company.id) {
    throw new AppError("You can only manage users from your own company.", 403);
  }

  if (targetUser.role === "platform_admin") {
    throw new AppError("Platform admins cannot be managed from a company workspace.", 403);
  }

  const { error: authError } = await admin.auth.admin.deleteUser(userId);

  if (authError) {
    throw new AppError("Unable to delete the company user account.", 500);
  }

  const { error: profileDeleteError } = await admin
    .from("users")
    .delete()
    .eq("id", userId)
    .eq("company_id", company.id);

  if (profileDeleteError) {
    throw new AppError("The login was deleted, but the company profile record could not be cleaned up.", 500);
  }

  return { success: true };
}
