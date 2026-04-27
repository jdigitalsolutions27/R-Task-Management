import { NextRequest, NextResponse } from "next/server";

import { resolveCompanyVerificationRedirect } from "@/lib/db/company-onboarding";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?verification=invalid", request.url));
  }

  try {
    const result = await resolveCompanyVerificationRedirect(token);
    const target = new URL(
      result.url.replace(/^https?:\/\/[^/]+/, ""),
      request.url,
    );

    return NextResponse.redirect(target);
  } catch {
    return NextResponse.redirect(new URL("/login?verification=invalid", request.url));
  }
}
