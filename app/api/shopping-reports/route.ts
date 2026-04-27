import { NextResponse } from "next/server";

import { resolveRequestContext } from "@/lib/db/context";
import { deleteReport, upsertReport } from "@/lib/db/reports";
import { AppError, createErrorResponse } from "@/lib/utils/http";
import { reportSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const context = await resolveRequestContext();
    const payload = await request.json();

    if (!context) {
      throw new AppError("Authentication required.", 401);
    }

    const data = await upsertReport(
      context,
      reportSchema.parse(payload),
      payload.id || undefined,
    );

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await resolveRequestContext();
    const id = new URL(request.url).searchParams.get("id");

    if (!context) {
      throw new AppError("Authentication required.", 401);
    }

    if (!id) {
      throw new AppError("Report id is required.", 400);
    }

    await deleteReport(context, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}

