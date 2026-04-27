import { NextResponse } from "next/server";

import { resolveRequestContext } from "@/lib/db/context";
import { AppError, createErrorResponse } from "@/lib/utils/http";
import { profileSettingsSchema } from "@/lib/validation/schemas";

export async function PUT(request: Request) {
  try {
    const context = await resolveRequestContext();

    if (!context) {
      throw new AppError("Authentication required.", 401);
    }

    const body = profileSettingsSchema.parse(await request.json());
    const contactNumber = body.contactNumber?.trim() || null;

    const { data, error } = await context.supabase
      .from("users")
      .update({
        contact_number: contactNumber,
        full_name: body.fullName,
      })
      .eq("id", context.profile.id)
      .select("*")
      .single();

    if (error) {
      throw new AppError("Unable to update your profile.", 500);
    }

    const { error: metadataError } = await context.supabase.auth.updateUser({
      data: {
        contact_number: contactNumber,
        full_name: body.fullName,
      },
    });

    if (metadataError) {
      throw new AppError("Profile saved, but account metadata could not be updated.", 500);
    }

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}
