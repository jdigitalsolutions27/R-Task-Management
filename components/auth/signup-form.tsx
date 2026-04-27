"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { registerSchema, type RegisterInput } from "@/lib/validation/schemas";

export function SignupForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<RegisterInput>({
    defaultValues: {
      companySlug: "",
      email: "",
      fullName: "",
      inviteCode: "",
      password: "",
      role: "employee",
    },
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: RegisterInput) {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/auth/register", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setErrorMessage(payload.error ?? "Unable to create the account right now.");
        setIsSubmitting(false);
        return;
      }

      form.reset({
        companySlug: "",
        email: "",
        fullName: "",
        inviteCode: "",
        password: "",
        role: "employee",
      });
      setSuccessMessage(
        "Check your email to verify your account. Once verified, you can sign in right away.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create the account. Check the Supabase environment variables.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="signup-name">
            Full name
          </label>
          <Input id="signup-name" {...form.register("fullName")} />
          <p className="text-xs text-rose-600">{form.formState.errors.fullName?.message}</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="signup-email">
            Work email
          </label>
          <Input id="signup-email" type="email" {...form.register("email")} />
          <p className="text-xs text-rose-600">{form.formState.errors.email?.message}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="signup-company">
            Company slug
          </label>
          <Input
            id="signup-company"
            placeholder="rtask-realty"
            {...form.register("companySlug")}
          />
          <p className="text-xs text-rose-600">{form.formState.errors.companySlug?.message}</p>
          <p className="text-xs text-slate-500">Use the exact active company slug, such as `rtask-realty`.</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="signup-invite">
            Invite code
          </label>
          <Input id="signup-invite" placeholder="Optional" {...form.register("inviteCode")} />
          <p className="text-xs text-slate-500">Use either an active company slug or a valid invite code.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="signup-role">
            Requested role
          </label>
          <Select id="signup-role" {...form.register("role")}>
            <option value="employee">Employee</option>
            <option value="inspector">Inspector</option>
            <option value="corporate_user">Corporate User</option>
          </Select>
          <p className="text-xs text-rose-600">{form.formState.errors.role?.message}</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="signup-password">
            Password
          </label>
          <div className="relative">
            <Input
              id="signup-password"
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
          <p className="text-xs text-rose-600">{form.formState.errors.password?.message}</p>
        </div>
      </div>
      {errorMessage ? (
        <p className="app-status-banner app-status-banner-error">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="app-status-banner app-status-banner-success">{successMessage}</p>
      ) : null}
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Submitting..." : "Create account"}
      </Button>
    </form>
  );
}
