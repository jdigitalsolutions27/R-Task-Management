import { NextResponse } from "next/server";

import { resolveRequestContext, assertCapabilityContext, assertCompanyContext } from "@/lib/db/context";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/auth/permissions";
import { AppError, createErrorResponse } from "@/lib/utils/http";

const COMPANY_LOGO_BUCKET = "rtask-company-branding";
const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getLogoExtension(file: File) {
  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

export async function POST(request: Request) {
  try {
    const context = await resolveRequestContext();

    if (!context) {
      throw new AppError("Authentication required.", 401);
    }

    if (!isPlatformAdmin(context.profile.role)) {
      assertCapabilityContext(context, "settings:manage");
    }

    const formData = await request.formData();
    const file = formData.get("asset");
    const requestedCompanyId = String(formData.get("companyId") ?? "").trim();
    const companyId = isPlatformAdmin(context.profile.role)
      ? requestedCompanyId || "draft"
      : assertCompanyContext(context).id;

    if (!(file instanceof File)) {
      throw new AppError("Choose a logo image to upload.", 400);
    }

    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
      throw new AppError("Upload a JPG, PNG, or WebP image.", 422);
    }

    if (file.size > MAX_LOGO_SIZE) {
      throw new AppError("Company logo must be 5 MB or smaller.", 422);
    }

    const admin = createAdminSupabaseClient();
    const { error: bucketError } = await admin.storage.createBucket(COMPANY_LOGO_BUCKET, {
      allowedMimeTypes: Array.from(ALLOWED_LOGO_TYPES),
      fileSizeLimit: MAX_LOGO_SIZE,
      public: true,
    });

    if (bucketError && !/already exists/i.test(bucketError.message)) {
      throw new AppError("Unable to prepare company branding storage.", 500);
    }

    const extension = getLogoExtension(file);
    const storagePath = `companies/${companyId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(COMPANY_LOGO_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw new AppError("Unable to upload the company logo.", 500);
    }

    const {
      data: { publicUrl },
    } = admin.storage.from(COMPANY_LOGO_BUCKET).getPublicUrl(storagePath);

    return NextResponse.json({ logoUrl: publicUrl });
  } catch (error) {
    return createErrorResponse(error);
  }
}
