import type { ReactNode } from "react";

import { PlatformShell } from "@/components/platform/platform-shell";
import { requirePlatformSession } from "@/lib/auth/session";

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  const context = await requirePlatformSession();

  return (
    <PlatformShell
      avatarUrl={context.profile.avatar_url}
      fullName={context.profile.full_name}
    >
      {children}
    </PlatformShell>
  );
}
