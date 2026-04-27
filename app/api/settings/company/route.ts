import { NextResponse } from "next/server";

import { resolveRequestContext } from "@/lib/db/context";
import { updateCompanySettings } from "@/lib/db/settings";
import { AppError, createErrorResponse } from "@/lib/utils/http";
import { tenantCompanySettingsSchema } from "@/lib/validation/schemas";

export async function PUT(request: Request) {
  try {
    const context = await resolveRequestContext();

    if (!context) {
      throw new AppError("Authentication required.", 401);
    }

    const data = await updateCompanySettings(
      context,
      tenantCompanySettingsSchema.parse(await request.json()),
    );

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}
