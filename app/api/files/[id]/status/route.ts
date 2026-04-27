import { NextResponse } from "next/server";

import { resolveRequestContext } from "@/lib/db/context";
import { updateFileStatus } from "@/lib/db/files";
import { AppError, createErrorResponse } from "@/lib/utils/http";
import { fileStatusSchema } from "@/lib/validation/schemas";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await resolveRequestContext();
    const { id } = await params;

    if (!context) {
      throw new AppError("Authentication required.", 401);
    }

    const body = fileStatusSchema.parse(await request.json());
    const data = await updateFileStatus(context, id, body);

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}

