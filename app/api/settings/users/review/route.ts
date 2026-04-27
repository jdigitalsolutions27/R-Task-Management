import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveRequestContext } from "@/lib/db/context";
import { deleteCompanyUser, manageCompanyUser } from "@/lib/db/settings";
import { AppError, createErrorResponse } from "@/lib/utils/http";

const reviewSchema = z.object({
  action: z.enum(["approve", "reject", "lock", "unlock"]),
  role: z.enum(["corporate_user", "employee", "inspector"]).optional(),
  userId: z.string().uuid(),
});

const deleteSchema = z.object({
  userId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const context = await resolveRequestContext();

    if (!context) {
      throw new AppError("Authentication required.", 401);
    }

    const body = reviewSchema.parse(await request.json());
    const data = await manageCompanyUser(context, body);

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await resolveRequestContext();

    if (!context) {
      throw new AppError("Authentication required.", 401);
    }

    const body = deleteSchema.parse(await request.json());
    const data = await deleteCompanyUser(context, body.userId);

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}
