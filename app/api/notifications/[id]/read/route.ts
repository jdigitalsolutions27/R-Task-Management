import { NextResponse } from "next/server";

import { resolveRequestContext } from "@/lib/db/context";
import { AppError, createErrorResponse } from "@/lib/utils/http";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await resolveRequestContext();

    if (!context) {
      throw new AppError("Authentication required.", 401);
    }

    const { id } = await params;
    const { data, error } = await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("recipient_user_id", context.profile.id)
      .select("*")
      .single();

    if (error) {
      throw new AppError("Unable to mark this notification as read.", 500);
    }

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}
