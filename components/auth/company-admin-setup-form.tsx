"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { adminSetupSchema, type AdminSetupInput } from "@/lib/validation/schemas";

export function CompanyAdminSetupForm({
  companyName,
  companySlug,
  email,
  token,
}: {
  companyName: string;
  companySlug: string;
  email: string;
  token: string;
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<AdminSetupInput>({
    defaultValues: {
      confirmPassword: "",
      fullName: "",
      password: "",
      token,
    },
    resolver: zodResolver(adminSetupSchema),
  });

  const strengthHint = useMemo(
    () => "Use at least 12 characters with uppercase, lowercase, and a number.",
    [],
  );

  async function onSubmit(values: AdminSetupInput) {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/company/admin-setup", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to finish the admin setup.");
      }

      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: values.password,
      });

      if (error) {
        router.push("/login?admin-ready=1");
        router.refresh();
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to finish the admin setup.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="admin-setup-company">
            Company
          </label>
          <Input id="admin-setup-company" disabled value={companyName} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="admin-setup-slug">
            Company slug
          </label>
          <Input id="admin-setup-slug" disabled value={companySlug} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="admin-setup-email">
          Verified support email
        </label>
        <Input id="admin-setup-email" disabled value={email} />
        <p className="text-xs text-slate-500">
          This first admin account is locked to the verified company support email.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="admin-setup-name">
          Admin full name
        </label>
        <Input id="admin-setup-name" autoComplete="name" {...form.register("fullName")} />
        <p className="text-xs text-rose-600">{form.formState.errors.fullName?.message}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="admin-setup-password">
            Password
          </label>
          <div className="relative">
            <Input
              id="admin-setup-password"
              className="pr-12"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...form.register("password")}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border border-[#C9A646]/35 bg-[#fdf9ed] text-[#8A6A16] transition-all duration-200 hover:border-[#C9A646] hover:bg-[#fff4cf] hover:text-[#6e5310]"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="text-xs text-slate-500">{strengthHint}</p>
          <p className="text-xs text-rose-600">{form.formState.errors.password?.message}</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="admin-setup-confirm-password">
            Confirm password
          </label>
          <div className="relative">
            <Input
              id="admin-setup-confirm-password"
              className="pr-12"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              {...form.register("confirmPassword")}
            />
            <button
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border border-[#C9A646]/35 bg-[#fdf9ed] text-[#8A6A16] transition-all duration-200 hover:border-[#C9A646] hover:bg-[#fff4cf] hover:text-[#6e5310]"
              onClick={() => setShowConfirmPassword((current) => !current)}
              type="button"
            >
              {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="text-xs text-rose-600">{form.formState.errors.confirmPassword?.message}</p>
        </div>
      </div>

      {errorMessage ? <p className="app-status-banner app-status-banner-error">{errorMessage}</p> : null}

      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Creating admin account..." : "Finish admin setup"}
      </Button>
    </form>
  );
}
