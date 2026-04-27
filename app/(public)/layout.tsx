import type { ReactNode } from "react";

import { PasswordRecoveryRedirect } from "@/components/auth/password-recovery-redirect";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { getSiteContent } from "@/lib/db/site-content";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const siteContent = await getSiteContent();

  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      <PasswordRecoveryRedirect />
      <PublicHeader content={siteContent.header} />
      <main>{children}</main>
      <PublicFooter content={siteContent.footer} />
    </div>
  );
}
