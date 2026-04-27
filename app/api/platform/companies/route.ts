import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePlatformSession } from "@/lib/auth/session";
import {
  createPlatformCompany,
  deletePlatformCompany,
  updatePlatformCompany,
} from "@/lib/db/platform";
import { createErrorResponse } from "@/lib/utils/http";
import { companySettingsSchema } from "@/lib/validation/schemas";

const companyUpdateSchema = companySettingsSchema.extend({
  companyId: z.string().uuid(),
});

const companyDeleteSchema = z.object({
  companyId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const context = await requirePlatformSession();
    const data = await createPlatformCompany(
      companySettingsSchema.parse(await request.json()),
      context.profile.id,
    );

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const context = await requirePlatformSession();
    const payload = companyUpdateSchema.parse(await request.json());
    const data = await updatePlatformCompany(payload.companyId, payload, context.profile.id);

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requirePlatformSession();
    const payload = companyDeleteSchema.parse(await request.json());
    await deletePlatformCompany(payload.companyId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}
