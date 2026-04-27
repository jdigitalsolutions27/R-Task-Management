import { redirect } from "next/navigation";

import {
  resolveRequestContext,
  type SessionContext,
} from "@/lib/db/context";
import { hasCapability, isPlatformAdmin } from "@/lib/auth/permissions";
import type { Capability } from "@/types/app";

export async function requireSession(capability?: Capability): Promise<SessionContext> {
  const context = await resolveRequestContext();

  if (!context) {
    redirect("/login");
  }

  if (isPlatformAdmin(context.profile.role)) {
    redirect("/platform");
  }

  if (context.profile.status !== "approved" && context.profile.role !== "super_admin") {
    redirect("/login?pending=1");
  }

  if (capability && !hasCapability(context.profile.role, capability)) {
    redirect("/dashboard");
  }

  return context;
}

export async function requirePlatformSession(): Promise<SessionContext> {
  const context = await resolveRequestContext();

  if (!context) {
    redirect("/platform-login");
  }

  if (!isPlatformAdmin(context.profile.role)) {
    redirect("/dashboard");
  }

  return context;
}
