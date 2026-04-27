import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveRequestContext } from "@/lib/db/context";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { AppError, createErrorResponse } from "@/lib/utils/http";

const historyDeleteSchema = z.object({
  ids: z.array(z.uuid()).min(1, "Choose at least one history item to delete."),
});

export async function DELETE(request: Request) {
  try {
    const context = await resolveRequestContext();

    if (!context) {
      throw new AppError("Authentication required.", 401);
    }

    if (!context.can("history:manage")) {
      throw new AppError("You do not have access to delete history.", 403);
    }

    if (!context.company) {
      throw new AppError("Company scope is required to delete history.", 400);
    }

    const body = historyDeleteSchema.parse(await request.json());
    const admin = createAdminSupabaseClient();
    const { error } = await admin
      .from("audit_logs")
      .delete()
      .eq("company_id", context.company.id)
      .in("id", body.ids);

    if (error) {
      throw new AppError("Unable to delete selected history items.", 500);
    }

    return NextResponse.json({ deleted: body.ids.length });
  } catch (error) {
    return createErrorResponse(error);
  }
}
