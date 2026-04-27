import { NextResponse } from "next/server";

import { resolveRequestContext } from "@/lib/db/context";
import {
  createFileRecord,
  deleteFileRecord,
} from "@/lib/db/files";
import { createErrorResponse, AppError } from "@/lib/utils/http";
import { uploadRecordSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const context = await resolveRequestContext();

    if (!context) {
      throw new AppError("Authentication required.", 401);
    }

    const body = uploadRecordSchema.parse(await request.json());
    const data = await createFileRecord(context, body);

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await resolveRequestContext();
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("id");

    if (!context) {
      throw new AppError("Authentication required.", 401);
    }

    if (!fileId) {
      throw new AppError("File id is required.", 400);
    }

    await deleteFileRecord(context, fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}

