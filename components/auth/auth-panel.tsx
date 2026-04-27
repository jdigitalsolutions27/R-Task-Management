import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export function AuthPanel({
  configMessage,
  infoMessage,
  mode = "login",
  pendingMessage,
  portal = "client",
  showSignup = true,
  switchBasePath = "/login",
}: {
  configMessage?: string;
  infoMessage?: string;
  mode?: "login" | "signup";
  pendingMessage?: string;
  portal?: "client" | "platform";
  showSignup?: boolean;
  switchBasePath?: string;
}) {
  const activeTab = showSignup ? mode : "login";

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="inline-flex rounded-md border border-[#ddd6ce] bg-[#f8f6f2] p-1">
          <Link
            className={cn(
              "cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200",
              activeTab === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
            )}
            href={switchBasePath}
          >
            Login
          </Link>
          {showSignup ? (
            <Link
              className={cn(
                "cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200",
                activeTab === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
              )}
              href={`${switchBasePath}?mode=signup`}
            >
              Sign up
            </Link>
          ) : null}
        </div>
        <div>
          <CardTitle>
            {activeTab === "login"
              ? portal === "platform"
                ? "Access the platform controller"
                : "Access the client portal"
              : "Create a secure account"}
          </CardTitle>
          <p className="mt-2 text-sm text-slate-500">
            {activeTab === "login"
              ? portal === "platform"
                ? "Internal access for platform administrators only."
                : "Sign in with your approved company account."
              : "Create a secure account with an active company slug or valid invite code, then verify your email."}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {infoMessage ? (
          <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
            {infoMessage}
          </p>
        ) : null}
        {pendingMessage ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {pendingMessage}
          </p>
        ) : null}
        {configMessage ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {configMessage}
          </p>
        ) : null}
        {activeTab === "login" ? <LoginForm portal={portal} /> : <SignupForm />}
      </CardContent>
    </Card>
  );
}
