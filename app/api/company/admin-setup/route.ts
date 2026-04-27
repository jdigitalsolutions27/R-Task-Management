import { NextResponse } from "next/server";

import { completeCompanyAdminSetup } from "@/lib/db/company-onboarding";
import { createErrorResponse } from "@/lib/utils/http";
import { adminSetupSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const data = await completeCompanyAdminSetup(adminSetupSchema.parse(await request.json()));

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}
