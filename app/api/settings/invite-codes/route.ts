import { NextResponse } from "next/server";

import { resolveRequestContext } from "@/lib/db/context";
import { createInviteCode, deactivateInviteCode } from "@/lib/db/settings";
import { AppError, createErrorResponse } from "@/lib/utils/http";
import { inviteCodeSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const context = await resolveRequestContext();

    if (!context) {
      throw new AppError("Authentication required.", 401);
    }

    const data = await createInviteCode(
      context,
      inviteCodeSchema.parse(await request.json()),
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
      throw new AppError("Invite id is required.", 400);
    }

    await deactivateInviteCode(context, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}

