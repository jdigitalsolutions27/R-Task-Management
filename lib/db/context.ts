import type { SupabaseClient } from "@supabase/supabase-js";

import { hasCapability } from "@/lib/auth/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/utils/http";
import type { Capability, Company, RequestContext, UserProfile } from "@/types/app";
import type { Database } from "@/types/database";

export interface SessionContext extends RequestContext {
  supabase: SupabaseClient<Database>;
  can: (capability: Capability) => boolean;
}

export async function getUserProfileById(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();

  if (error) {
    throw new AppError("Unable to resolve the signed-in user profile.", 401);
  }

  return data;
}

export async function getCompanyById(
  supabase: SupabaseClient<Database>,
  companyId: string | null,
) {
  if (!companyId) {
    return null;
  }

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (error) {
    throw new AppError("Unable to load the company record.", 404);
  }

  return data;
}

export async function resolveRequestContext(): Promise<SessionContext | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const profile = await getUserProfileById(supabase, authUser.id);
  const company = await getCompanyById(supabase, profile.company_id);

  return {
    authUser,
    company,
    profile,
    supabase,
    can: (capability) => hasCapability(profile.role, capability),
  };
}

export function assertApprovedUser(profile: UserProfile) {
  if (profile.status !== "approved" && profile.role !== "super_admin" && profile.role !== "platform_admin") {
    throw new AppError("Your account is pending approval.", 403);
  }
}

export function assertCompanyContext(context: SessionContext): Company {
  if (!context.company && context.profile.role !== "super_admin") {
    throw new AppError("No company is linked to this account.", 403);
  }

  if (!context.company) {
    throw new AppError("This action requires a company scope.", 400);
  }

  return context.company;
}

export function assertCapabilityContext(
  context: SessionContext,
  capability: Capability,
) {
  if (!context.can(capability)) {
    throw new AppError("You do not have access to this resource.", 403);
  }
}

export function assertTenantAccess(context: SessionContext, companyId: string) {
  if (context.profile.role === "super_admin") {
    return;
  }

  if (context.profile.company_id !== companyId) {
    throw new AppError("Tenant access denied.", 403);
  }
}
