"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validation/schemas";

export function ResetPasswordForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const form = useForm<ResetPasswordInput>({
    defaultValues: {
      confirmPassword: "",
      password: "",
    },
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    let cancelled = false;
    const supabase = createBrowserSupabaseClient();

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!cancelled) {
        setHasSession(Boolean(session));
      }
    }

    checkSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        setHasSession(Boolean(session));
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(values: ResetPasswordInput) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setHasSession(false);
        throw new Error("This reset link has expired. Request a new password recovery email.");
      }

      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        throw error;
      }

      await supabase.auth.signOut();
      form.reset({
        confirmPassword: "",
        password: "",
      });
      setHasSession(false);
      setSuccessMessage("Your password was updated. Sign in with the new password.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update your password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successMessage) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {successMessage}
        </p>
        <Link
          className="inline-flex h-10 w-full items-center justify-center rounded-md border border-[#C9A646] bg-[#C9A646] px-4 text-sm font-semibold text-[#111827] shadow-[0_12px_26px_rgba(201,166,70,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8933A] hover:bg-[#B8933A]"
          href="/login"
        >
          Return to login
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      {hasSession === false ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Open the latest password recovery email, or request another reset link from the login
          screen.
        </p>
      ) : null}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="reset-password">
          New password
        </label>
        <div className="relative">
          <Input
            id="reset-password"
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
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="reset-confirm-password">
          Confirm password
        </label>
        <div className="relative">
          <Input
            id="reset-confirm-password"
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
        <p className="text-xs text-rose-600">
          {form.formState.errors.confirmPassword?.message}
        </p>
      </div>
      {errorMessage ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
