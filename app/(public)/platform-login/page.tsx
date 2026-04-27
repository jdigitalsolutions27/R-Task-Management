import Image from "next/image";
import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth/auth-panel";
import { resolveRequestContext } from "@/lib/db/context";

export default async function PlatformLoginPage() {
  const context = await resolveRequestContext();

  if (context?.profile.role === "platform_admin") {
    redirect("/platform");
  }

  if (context) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-140px)] max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
      <div className="relative hidden min-h-[580px] overflow-hidden rounded-lg lg:block">
        <Image
          src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80"
          alt="Platform operations control center"
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="absolute inset-x-0 bottom-0 p-8 text-white">
          <p className="text-sm font-semibold uppercase text-[#dce4dd]">
            Internal platform access
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Manage the website, tenant companies, and platform-wide operations from one secure console.
          </h1>
        </div>
      </div>
      <div className="flex items-center">
        <AuthPanel portal="platform" showSignup={false} switchBasePath="/platform-login" />
      </div>
    </div>
  );
}
