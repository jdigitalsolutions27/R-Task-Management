import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

async function autoApproveVerifiedUser(userId: string | undefined, type: EmailOtpType | null) {
  if (!userId || type !== "signup") {
    return;
  }

  const admin = createAdminSupabaseClient();
  const approvedAt = new Date().toISOString();
  const { error } = await admin
    .from("users")
    .update({
      approved_at: approvedAt,
      approved_by: null,
      status: "approved",
    })
    .eq("id", userId)
    .neq("role", "platform_admin")
    .neq("role", "super_admin");

  if (error) {
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const nextPath = getSafeRedirectPath(requestUrl.searchParams.get("next"));
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const redirectPath = nextPath ?? (type === "recovery" ? "/reset-password" : "/dashboard");

  if (code || (tokenHash && type)) {
    const supabase = await createServerSupabaseClient();
    let verifiedUserId: string | undefined;

    if (code) {
      const { data } = await supabase.auth.exchangeCodeForSession(code);
      verifiedUserId = data.user?.id;
    } else if (tokenHash && type) {
      const { data } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      verifiedUserId = data.user?.id;
    }

    await autoApproveVerifiedUser(verifiedUserId, type);
  }

  return NextResponse.redirect(new URL(redirectPath, request.url));
}
