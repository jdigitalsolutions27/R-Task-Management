"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { CompanyLogoField } from "@/components/company/company-logo-field";
import { CompanyThemeField } from "@/components/company/company-theme-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tenantCompanySettingsSchema, type TenantCompanySettingsInput } from "@/lib/validation/schemas";
import type { Company } from "@/types/app";

export function CompanySettingsForm({ company }: { company: Company }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const form = useForm<TenantCompanySettingsInput>({
    defaultValues: {
      backgroundColor: company.background_color ?? "#F7F5F2",
      inviteApprovalRequired: company.invite_approval_required,
      logoUrl: company.logo_url ?? "",
      primaryColor: company.primary_color ?? "#0F172A",
      secondaryColor: company.secondary_color ?? "#C9A646",
    },
    resolver: zodResolver(tenantCompanySettingsSchema),
  });

  async function onSubmit(values: TenantCompanySettingsInput) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/settings/company", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save company settings.");
      }

      setSuccessMessage("Company settings saved.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save company settings.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="grid gap-5 rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Company name</label>
          <Input disabled value={company.name} />
          <p className="text-xs text-slate-500">Managed by the platform controller.</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Slug</label>
          <Input disabled value={company.slug} />
          <p className="text-xs text-slate-500">This is locked after company onboarding.</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Support email</label>
          <Input disabled type="email" value={company.support_email ?? ""} />
          <p className="text-xs text-slate-500">Platform-managed because it protects company verification and admin setup.</p>
        </div>
        <label className="flex items-center gap-3 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-slate-700">
          <input type="checkbox" {...form.register("inviteApprovalRequired")} />
          Require admin approval for self-signup without a valid invite
        </label>
      </div>
      <CompanyLogoField
        companyId={company.id}
        companyName={company.name}
        description="This logo appears in your company workspace for admins and users. Upload a JPG, PNG, or WebP image up to 5 MB."
        onChange={(value) => form.setValue("logoUrl", value, { shouldDirty: true })}
        value={form.watch("logoUrl")}
      />
      <CompanyThemeField
        backgroundColor={form.watch("backgroundColor")}
        onChange={(field, value) => form.setValue(field, value, { shouldDirty: true, shouldValidate: true })}
        primaryColor={form.watch("primaryColor")}
        secondaryColor={form.watch("secondaryColor")}
      />
      {errorMessage ? (
        <p className="app-status-banner app-status-banner-error">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="app-status-banner app-status-banner-success">{successMessage}</p>
      ) : null}
      <div>
        <Button disabled={isPending} type="submit">
          {isPending ? "Saving..." : "Save company settings"}
        </Button>
      </div>
    </form>
  );
}
