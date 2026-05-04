"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, MailCheck, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { CompanyLogoField } from "@/components/company/company-logo-field";
import { CompanyLogoMark } from "@/components/company/company-logo-mark";
import { CompanyThemeField } from "@/components/company/company-theme-field";
import { companySettingsSchema, type CompanySettingsInput } from "@/lib/validation/schemas";
import { formatDate } from "@/lib/utils/format";
import type { Company } from "@/types/app";

const blankCompany: CompanySettingsInput = {
  backgroundColor: "#F8F6F2",
  inviteApprovalRequired: true,
  logoUrl: "",
  name: "",
  primaryColor: "#0F172A",
  secondaryColor: "#C9A646",
  slug: "",
  supportEmail: "",
};

export function PlatformCompanyManager({
  companies,
}: {
  companies: Company[];
}) {
  const router = useRouter();
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingOnboardingAction, setPendingOnboardingAction] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const form = useForm<CompanySettingsInput>({
    defaultValues: blankCompany,
    resolver: zodResolver(companySettingsSchema),
  });

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return companies;
    }

    return companies.filter((company) =>
      [company.name, company.slug, company.support_email ?? ""].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [companies, search]);

  function getStatusTone(company: Company) {
    if (company.status === "active") {
      return "approved" as const;
    }

    if (company.status === "verified") {
      return "draft" as const;
    }

    return "pending" as const;
  }

  function getStatusLabel(company: Company) {
    if (company.status === "active" && company.first_admin_user_id) {
      return "Active";
    }

    if (company.status === "verified" || (company.status === "active" && !company.first_admin_user_id)) {
      return "Ready for admin setup";
    }

    return "Waiting for email verification";
  }

  function beginCreate() {
    setEditingCompanyId(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    form.reset(blankCompany);
  }

  function beginEdit(company: Company) {
    setEditingCompanyId(company.id);
    setErrorMessage(null);
    setSuccessMessage(null);
    form.reset({
      backgroundColor: company.background_color ?? "#F8F6F2",
      inviteApprovalRequired: company.invite_approval_required,
      logoUrl: company.logo_url ?? "",
      name: company.name,
      primaryColor: company.primary_color ?? "#0F172A",
      secondaryColor: company.secondary_color ?? "#C9A646",
      slug: company.slug,
      supportEmail: company.support_email ?? "",
    });
  }

  async function onSubmit(values: CompanySettingsInput) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/platform/companies", {
        body: JSON.stringify(
          editingCompanyId
            ? { ...values, companyId: editingCompanyId }
            : values,
        ),
        headers: { "Content-Type": "application/json" },
        method: editingCompanyId ? "PUT" : "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save the company.");
      }

      const onboarding = payload.data?.onboarding as
        | { delivery: "manual" | "sent"; purpose: "company_verification" | "admin_setup" }
        | undefined;
      const actionMessage =
        onboarding?.purpose === "company_verification"
          ? onboarding.delivery === "sent"
            ? "Verification email sent to the support address."
            : "Verification link is ready to copy from the directory if the email does not arrive."
          : onboarding?.purpose === "admin_setup"
            ? onboarding.delivery === "sent"
              ? "Admin setup email sent to the support address."
              : "Admin setup link is ready to copy from the directory if the email does not arrive."
            : "";

      setSuccessMessage(
        [editingCompanyId ? "Company updated." : "Company created.", actionMessage]
          .filter(Boolean)
          .join(" "),
      );
      setEditingCompanyId(null);
      form.reset(blankCompany);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save the company.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteCompany(companyId: string) {
    if (
      !window.confirm(
        "Delete this company? If there are no linked workflow records left, the company and its remaining company login accounts will be removed.",
      )
    ) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/platform/companies", {
        body: JSON.stringify({ companyId }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete the company.");
      }

      setSuccessMessage("Company deleted.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete the company.");
    }
  }

  async function handleOnboardingAction(
    company: Company,
    action: "send_verification" | "send_admin_setup",
    mode: "copy" | "send",
  ) {
    const actionKey = `${company.id}:${action}:${mode}`;
    setPendingOnboardingAction(actionKey);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/platform/companies/onboarding", {
        body: JSON.stringify({
          action,
          companyId: company.id,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to continue the company onboarding.");
      }

      const data = payload.data as {
        delivery: "manual" | "sent";
        purpose: "company_verification" | "admin_setup";
        url: string;
      };

      if (mode === "copy") {
        await navigator.clipboard.writeText(data.url);
        setSuccessMessage(
          data.purpose === "company_verification"
            ? "Verification link copied."
            : "Admin setup link copied.",
        );
      } else {
        setSuccessMessage(
          data.delivery === "sent"
            ? data.purpose === "company_verification"
              ? "Verification email sent to the company support email."
              : "Admin setup email sent to the company support email."
            : data.purpose === "company_verification"
              ? "Email delivery needs attention, but the verification link is ready to copy."
              : "Email delivery needs attention, but the admin setup link is ready to copy.",
        );
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to continue the company onboarding.",
      );
    } finally {
      setPendingOnboardingAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <form
        className="grid gap-5 rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#111827]">
              {editingCompanyId ? "Edit company" : "Add a company"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Create the client company, verify its support email, and prepare the first admin setup from one place.
            </p>
          </div>
          <Button onClick={beginCreate} type="button" variant="outline">
            <Plus className="h-4 w-4" />
            New company
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Company name</label>
            <Input {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Slug</label>
            <Input {...form.register("slug")} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Support email</label>
            <Input type="email" {...form.register("supportEmail")} />
            <p className="text-xs text-slate-500">
              This address receives the company verification email and the first admin setup link. Use a dedicated
              email that is not already registered to another platform account.
            </p>
          </div>
          <label className="flex items-center gap-3 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" {...form.register("inviteApprovalRequired")} />
            Require approval when users sign up without an invite
          </label>
        </div>

        <CompanyLogoField
          companyId={editingCompanyId}
          companyName={form.watch("name") || "Company"}
          description="Upload a square or landscape logo for the company workspace. JPG, PNG, and WebP are supported up to 5 MB."
          onChange={(value) => form.setValue("logoUrl", value, { shouldDirty: true })}
          value={form.watch("logoUrl")}
        />

        <CompanyThemeField
          backgroundColor={form.watch("backgroundColor")}
          onChange={(field, value) => form.setValue(field, value, { shouldDirty: true, shouldValidate: true })}
          primaryColor={form.watch("primaryColor")}
          secondaryColor={form.watch("secondaryColor")}
        />

        {errorMessage ? <p className="app-status-banner app-status-banner-error">{errorMessage}</p> : null}
        {successMessage ? <p className="app-status-banner app-status-banner-success">{successMessage}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Saving..." : editingCompanyId ? "Save company" : "Create company"}
          </Button>
          {editingCompanyId ? (
            <Button onClick={beginCreate} type="button" variant="outline">
              Cancel edit
            </Button>
          ) : null}
        </div>
      </form>

      <div className="space-y-4 rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#111827]">Company directory</h3>
            <p className="mt-1 text-sm text-slate-500">
              Review every tenant using the platform, resend onboarding emails, and keep company access clean.
            </p>
            <p className="mt-2 text-xs font-medium text-slate-400">
              Deleting a company also clears its remaining company login accounts. Workflow records like files, properties, inspections, reports, evictions, and support tickets must be cleared first.
            </p>
          </div>
          <Input
            className="w-full md:max-w-sm"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search companies"
            value={search}
          />
        </div>

        {filteredCompanies.length ? (
          <div className="overflow-x-auto">
            <table className="app-data-table min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Company</th>
                  <th className="px-4 py-3 text-left font-medium">Support</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Onboarding</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => (
                  <tr key={company.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <CompanyLogoMark companyName={company.name} logoUrl={company.logo_url} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900">{company.name}</p>
                          <p className="text-xs text-slate-500">{company.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-slate-700">{company.support_email ?? "Not set"}</p>
                        <p className="text-xs text-slate-500">
                          {company.support_email_verified_at
                            ? `Verified ${formatDate(company.support_email_verified_at)}`
                            : "Verification still pending"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <Badge tone={getStatusTone(company)}>{getStatusLabel(company)}</Badge>
                        <p className="text-xs text-slate-500">
                          {company.invite_approval_required
                            ? "Self-signup needs approval"
                            : "Self-signup can auto approve"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {company.status === "pending_verification" ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            disabled={pendingOnboardingAction === `${company.id}:send_verification:send`}
                            onClick={() => handleOnboardingAction(company, "send_verification", "send")}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <MailCheck className="h-4 w-4" />
                            {pendingOnboardingAction === `${company.id}:send_verification:send` ? "Sending..." : "Resend email"}
                          </Button>
                          <Button
                            disabled={pendingOnboardingAction === `${company.id}:send_verification:copy`}
                            onClick={() => handleOnboardingAction(company, "send_verification", "copy")}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <Copy className="h-4 w-4" />
                            Copy link
                          </Button>
                        </div>
                      ) : !company.first_admin_user_id ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            disabled={pendingOnboardingAction === `${company.id}:send_admin_setup:send`}
                            onClick={() => handleOnboardingAction(company, "send_admin_setup", "send")}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            {pendingOnboardingAction === `${company.id}:send_admin_setup:send` ? "Sending..." : "Send admin setup"}
                          </Button>
                          <Button
                            disabled={pendingOnboardingAction === `${company.id}:send_admin_setup:copy`}
                            onClick={() => handleOnboardingAction(company, "send_admin_setup", "copy")}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <Copy className="h-4 w-4" />
                            Copy link
                          </Button>
                        </div>
                      ) : (
                        <Badge tone="approved">Live and ready</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="space-y-1">
                        <p>{formatDate(company.created_at)}</p>
                        {company.activated_at ? (
                          <p className="text-xs text-slate-500">Active since {formatDate(company.activated_at)}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => beginEdit(company)} size="sm" type="button" variant="outline">
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          className="border-rose-300 bg-rose-50 text-rose-700 hover:border-rose-400 hover:bg-rose-100 hover:text-rose-800"
                          onClick={() => deleteCompany(company.id)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No companies found"
            description="Create your first company record or adjust the search query."
          />
        )}
      </div>
    </div>
  );
}
