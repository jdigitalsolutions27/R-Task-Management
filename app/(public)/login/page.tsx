import Image from "next/image";

import { AuthPanel } from "@/components/auth/auth-panel";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const mode = resolvedParams.mode === "signup" ? "signup" : "login";
  const pendingMessage =
    resolvedParams.pending === "1"
      ? "Your account exists, but a company administrator still needs to approve it."
      : undefined;
  const infoMessage =
    resolvedParams.confirmed === "1"
      ? "Email verified. You can sign in now."
      : resolvedParams["admin-ready"] === "1"
        ? "The first company admin account is ready. Sign in with the new credentials."
        : resolvedParams.verification === "invalid"
          ? "That onboarding link is no longer valid. Ask the platform administrator to resend it."
          : undefined;
  const configMessage =
    resolvedParams.config === "1"
      ? "Supabase environment variables are not configured yet. Add the values from .env.example to .env.local before using the portal."
      : undefined;

  return (
    <div className="mx-auto grid min-h-[calc(100vh-140px)] max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
      <div className="relative hidden min-h-[580px] overflow-hidden rounded-lg lg:block">
        <Image
          src="https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80"
          alt="Professional residential property exterior"
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-950/45" />
        <div className="absolute inset-x-0 bottom-0 p-8 text-white">
          <p className="text-sm font-semibold uppercase text-[#dce4dd]">
            Secure client access
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            File approvals, inspections, and reports in a single workspace.
          </h1>
        </div>
      </div>
      <div className="flex items-center">
        <AuthPanel
          configMessage={configMessage}
          infoMessage={infoMessage}
          mode={mode}
          pendingMessage={pendingMessage}
          switchBasePath="/login"
        />
      </div>
    </div>
  );
}
