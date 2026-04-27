import { NextResponse } from "next/server";

import { requirePlatformSession } from "@/lib/auth/session";
import { updatePlatformUser } from "@/lib/db/platform";
import { createErrorResponse } from "@/lib/utils/http";
import { platformUserUpdateSchema } from "@/lib/validation/schemas";

export async function PUT(request: Request) {
  try {
    const context = await requirePlatformSession();
    const payload = platformUserUpdateSchema.parse(await request.json());
    const data = await updatePlatformUser(payload.userId, {
      actorId: context.profile.id,
      role: payload.role,
      status: payload.status,
    });

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}
