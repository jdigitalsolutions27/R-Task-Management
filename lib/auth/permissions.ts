import { ROLE_CAPABILITIES } from "@/lib/auth/constants";
import type { AppRole, Capability } from "@/types/app";

export function hasCapability(role: AppRole, capability: Capability) {
  return ROLE_CAPABILITIES[role].includes(capability);
}

export function assertCapability(role: AppRole, capability: Capability) {
  if (!hasCapability(role, capability)) {
    throw new Error(`Unauthorized: missing capability ${capability}`);
  }
}

export function canReviewFile(role: AppRole) {
  return hasCapability(role, "files:approve");
}

export function canManageSettings(role: AppRole) {
  return hasCapability(role, "settings:manage");
}

export function isPlatformAdmin(role: AppRole) {
  return role === "platform_admin";
}

export function canViewAllCompanyFiles(role: AppRole) {
  return role === "super_admin" || role === "corporate_user";
}

export function canViewAllCompanyInspections(role: AppRole) {
  return role === "super_admin" || role === "corporate_user";
}

export function canViewAllCompanyEvictions(role: AppRole) {
  return role === "super_admin" || role === "corporate_user";
}
