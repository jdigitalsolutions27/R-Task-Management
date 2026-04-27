import { NextResponse } from "next/server";

import { requirePlatformSession } from "@/lib/auth/session";
import { resetSiteContent, saveSiteContent } from "@/lib/db/site-content";
import { createErrorResponse } from "@/lib/utils/http";
import { siteContentSchema } from "@/lib/validation/schemas";

export async function PUT(request: Request) {
  try {
    const context = await requirePlatformSession();

    const data = await saveSiteContent(
      context,
      siteContentSchema.parse(await request.json()),
    );

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    const context = await requirePlatformSession();

    await resetSiteContent(context);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}
