import { NextResponse } from "next/server";

import { resolveRequestContext } from "@/lib/db/context";
import { createFilePreviewUrl } from "@/lib/db/files";
import { AppError, createErrorResponse } from "@/lib/utils/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await resolveRequestContext();
    const { id } = await params;

    if (!context) {
      throw new AppError("Authentication required.", 401);
    }

    const signedUrl = await createFilePreviewUrl(context, id);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    return createErrorResponse(error);
  }
}
