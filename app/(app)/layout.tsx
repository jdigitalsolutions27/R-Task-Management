import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth/session";
import { getUnreadNotificationCount } from "@/lib/db/notifications";

async function getLayoutNotificationState() {
  const context = await requireSession();

  return {
    context,
    notificationCount: await getUnreadNotificationCount(context),
  };
}

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { context, notificationCount } = await getLayoutNotificationState();

  return (
    <AppShell
      avatarUrl={context.profile.avatar_url}
      companyBackgroundColor={context.company?.background_color ?? null}
      companyLogoUrl={context.company?.logo_url ?? null}
      companyName={context.company?.name ?? null}
      companyPrimaryColor={context.company?.primary_color ?? null}
      companySecondaryColor={context.company?.secondary_color ?? null}
      fullName={context.profile.full_name}
      notificationCount={notificationCount}
      role={context.profile.role}
      userId={context.profile.id}
    >
      {children}
    </AppShell>
  );
}
