import { NextResponse } from "next/server";

import { requirePlatformSession } from "@/lib/auth/session";
import { managePlatformSupportTicket } from "@/lib/db/support";
import { AppError, createErrorResponse } from "@/lib/utils/http";

export async function PATCH(request: Request) {
  try {
    const context = await requirePlatformSession();
    const payload = (await request.json()) as {
      action?: "archive" | "resolve" | "start";
      ticketId?: string;
    };

    if (!payload.ticketId || !payload.action) {
      throw new AppError("Ticket action and ticket id are required.", 400);
    }

    const data = await managePlatformSupportTicket(context, payload.ticketId, payload.action);
    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}
