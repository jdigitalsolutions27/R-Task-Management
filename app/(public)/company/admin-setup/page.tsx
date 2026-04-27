import Image from "next/image";
import Link from "next/link";

import { CompanyAdminSetupForm } from "@/components/auth/company-admin-setup-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompanyAdminSetupInvitation } from "@/lib/db/company-onboarding";

export default async function CompanyAdminSetupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const tokenValue = resolvedParams.token;
  const verifiedValue = resolvedParams.verified;
  const token = typeof tokenValue === "string" ? tokenValue : "";
  const verified = verifiedValue === "1";
  const invitation = token ? await getCompanyAdminSetupInvitation(token) : null;

  return (
    <div className="mx-auto grid min-h-[calc(100vh-140px)] max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
      <div className="relative hidden min-h-[580px] overflow-hidden rounded-lg lg:block">
        <Image
          src="https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80"
          alt="Property management onboarding"
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-950/45" />
        <div className="absolute inset-x-0 bottom-0 p-8 text-white">
          <p className="text-sm font-semibold uppercase text-[#dce4dd]">
            Secure company onboarding
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Finish the first admin account for this company workspace.
          </h1>
        </div>
      </div>
      <div className="flex items-center">
        <Card className="w-full">
          <CardHeader className="space-y-4">
            <div>
              <CardTitle>Set up the first company admin</CardTitle>
              <p className="mt-2 text-sm text-slate-500">
                This secure link is reserved for the verified company support email.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {verified ? (
              <p className="app-status-banner app-status-banner-success">
                Company email verified. Finish the admin account below.
              </p>
            ) : null}
            {invitation?.valid ? (
              <CompanyAdminSetupForm
                companyName={invitation.company.name}
                companySlug={invitation.company.slug}
                email={invitation.email}
                token={token}
              />
            ) : (
              <div className="space-y-4">
                <p className="app-status-banner app-status-banner-error">
                  This admin setup link is invalid, expired, or has already been used.
                </p>
                <Link className="text-sm font-semibold text-[#0F172A] hover:text-[#B8933A]" href="/login">
                  Return to client login
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
