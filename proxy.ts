import { NextResponse, type NextRequest } from "next/server";

import { PUBLIC_PATHS } from "@/lib/auth/constants";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { hasSupabaseEnv } from "@/lib/utils/env";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health");

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (!hasSupabaseEnv()) {
    if (isPublicPath) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/login?config=1", request.url));
  }

  const { response, user } = await updateSupabaseSession(request);

  if (!user && !isPublicPath && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
