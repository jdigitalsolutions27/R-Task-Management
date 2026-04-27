import { NextResponse } from "next/server";

import { registerUserWithEmailVerification } from "@/lib/db/registration";
import { createErrorResponse } from "@/lib/utils/http";
import { registerSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const payload = registerSchema.parse(await request.json());
    const data = await registerUserWithEmailVerification(payload);

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}
