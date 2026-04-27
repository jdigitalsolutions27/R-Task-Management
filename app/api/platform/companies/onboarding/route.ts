import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePlatformSession } from "@/lib/auth/session";
import { dispatchCompanyOnboardingAction } from "@/lib/db/company-onboarding";
import { createErrorResponse } from "@/lib/utils/http";

const onboardingSchema = z.object({
  action: z.enum(["send_verification", "send_admin_setup"]),
  companyId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const context = await requirePlatformSession();
    const payload = onboardingSchema.parse(await request.json());
    const data = await dispatchCompanyOnboardingAction({
      action: payload.action,
      actorId: context.profile.id,
      companyId: payload.companyId,
    });

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}
