import { NextResponse } from "next/server";

import { sendPasswordRecoveryEmail } from "@/lib/db/password-recovery";
import { isGmailSmtpEnabled } from "@/lib/utils/env";
import { AppError, createErrorResponse } from "@/lib/utils/http";
import { passwordRecoveryRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    if (!isGmailSmtpEnabled()) {
      throw new AppError("Password recovery email is not configured yet.", 503);
    }

    const payload = passwordRecoveryRequestSchema.parse(await request.json());
    await sendPasswordRecoveryEmail(payload.email);

    return NextResponse.json({
      data: {
        message: "If that email is registered, a password reset link is on the way.",
      },
    });
  } catch (error) {
    console.error("Password recovery email request failed", error);
    return createErrorResponse(error);
  }
}
