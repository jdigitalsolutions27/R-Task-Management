import { NextResponse } from "next/server";

import { resolveRequestContext } from "@/lib/db/context";
import { createSupportTicket, manageSupportTicket } from "@/lib/db/support";
import { AppError, createErrorResponse } from "@/lib/utils/http";
import { supportSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const context = await resolveRequestContext();

    if (!context) {
      throw new AppError("Authentication required.", 401);
    }

    const data = await createSupportTicket(
      context,
      supportSchema.parse(await request.json()),
    );

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await resolveRequestContext();

    if (!context) {
      throw new AppError("Authentication required.", 401);
    }

    const payload = (await request.json()) as {
      action?: "archive" | "escalate" | "resolve" | "start";
      ticketId?: string;
    };

    if (!payload.ticketId || !payload.action) {
      throw new AppError("Ticket action and ticket id are required.", 400);
    }

    const data = await manageSupportTicket(context, payload.ticketId, payload.action);
    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}
