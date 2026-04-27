"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  loginSchema,
  passwordRecoveryRequestSchema,
  type LoginInput,
  type PasswordRecoveryRequestInput,
} from "@/lib/validation/schemas";

export function LoginForm({
  portal = "client",
}: {
  portal?: "client" | "platform";
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryErrorMessage, setRecoveryErrorMessage] = useState<string | null>(null);
  const [recoverySuccessMessage, setRecoverySuccessMessage] = useState<string | null>(null);
  const [isRecoverySubmitting, setIsRecoverySubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"login" | "recovery">("login");
  const form = useForm<LoginInput>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });
  const recoveryForm = useForm<PasswordRecoveryRequestInput>({
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(passwordRecoveryRequestSchema),
  });

  async function onSubmit(values: LoginInput) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword(values);

      if (error) {
        setErrorMessage(error.message);
        setIsSubmitting(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Signed in, but no user session was returned.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role, status")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Unable to load the signed-in profile.");
      }

      if (portal === "platform") {
        if (profile.role !== "platform_admin") {
          await supabase.auth.signOut();
          setErrorMessage("This login is reserved for platform administrators.");
          setIsSubmitting(false);
          return;
        }

        router.push("/platform");
        router.refresh();
        return;
      }

      if (profile.role === "platform_admin") {
        router.push("/platform");
        router.refresh();
        return;
      }

      if (profile.status !== "approved" && profile.role !== "super_admin") {
        await supabase.auth.signOut();
        setErrorMessage("Your account exists, but a company administrator still needs to approve it.");
        setIsSubmitting(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Check the Supabase environment variables.",
      );
      setIsSubmitting(false);
    }
  }

  async function onRecoverySubmit(values: PasswordRecoveryRequestInput) {
    setIsRecoverySubmitting(true);
    setRecoveryErrorMessage(null);
    setRecoverySuccessMessage(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setRecoveryErrorMessage(error.message);
        setIsRecoverySubmitting(false);
        return;
      }

      setRecoverySuccessMessage("Check your email for a password reset link.");
    } catch (error) {
      setRecoveryErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to send the password reset email.",
      );
    } finally {
      setIsRecoverySubmitting(false);
    }
  }

  if (mode === "recovery") {
    return (
      <form className="space-y-4" onSubmit={recoveryForm.handleSubmit(onRecoverySubmit)}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="recovery-email">
            Email address
          </label>
          <Input
            id="recovery-email"
            type="email"
            autoComplete="email"
            {...recoveryForm.register("email")}
          />
          <p className="text-xs text-rose-600">
            {recoveryForm.formState.errors.email?.message}
          </p>
        </div>
        {recoveryErrorMessage ? (
          <p className="app-status-banner app-status-banner-error">{recoveryErrorMessage}</p>
        ) : null}
        {recoverySuccessMessage ? (
          <p className="app-status-banner app-status-banner-success">{recoverySuccessMessage}</p>
        ) : null}
        <Button className="w-full" disabled={isRecoverySubmitting} type="submit">
          {isRecoverySubmitting ? "Sending..." : "Send reset link"}
        </Button>
        <Button
          className="w-full"
          onClick={() => setMode("login")}
          type="button"
          variant="ghost"
        >
          Back to sign in
        </Button>
      </form>
    );
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="login-email">
          Email address
        </label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          {...form.register("email")}
        />
        <p className="text-xs text-rose-600">{form.formState.errors.email?.message}</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="login-password">
          Password
        </label>
        <div className="relative">
          <Input
            id="login-password"
            className="pr-24"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
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
      {errorMessage ? (
        <p className="app-status-banner app-status-banner-error">{errorMessage}</p>
      ) : null}
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
      <button
        className="w-full text-center text-sm font-semibold text-[#8A6A16] transition-colors hover:text-[#6e5310]"
        onClick={() => setMode("recovery")}
        type="button"
      >
        Forgot password?
      </button>
    </form>
  );
}
