import { NextResponse } from "next/server";

import { resolveRequestContext } from "@/lib/db/context";
import { deleteEviction, upsertEviction } from "@/lib/db/evictions";
import { AppError, createErrorResponse } from "@/lib/utils/http";
import { evictionSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const context = await resolveRequestContext();
    const payload = await request.json();

    if (!context) {
      throw new AppError("Authentication required.", 401);
    }

    const data = await upsertEviction(
      context,
      evictionSchema.parse(payload),
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
      throw new AppError("Eviction id is required.", 400);
    }

    await deleteEviction(context, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}

