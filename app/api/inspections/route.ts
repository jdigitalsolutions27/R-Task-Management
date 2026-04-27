import { NextResponse } from "next/server";

import { resolveRequestContext } from "@/lib/db/context";
import {
  deleteInspection,
  upsertInspection,
} from "@/lib/db/inspections";
import { AppError, createErrorResponse } from "@/lib/utils/http";
import { inspectionSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const context = await resolveRequestContext();
    const payload = await request.json();

    if (!context) {
      throw new AppError("Authentication required.", 401);
    }

    const data = await upsertInspection(
      context,
      inspectionSchema.parse(payload),
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
      throw new AppError("Inspection id is required.", 400);
    }

    await deleteInspection(context, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}

