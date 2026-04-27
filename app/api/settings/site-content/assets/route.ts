import { NextResponse } from "next/server";

import { requirePlatformSession } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { AppError, createErrorResponse } from "@/lib/utils/http";

const SITE_MEDIA_BUCKET = "rtask-site-media";
const MAX_ASSET_SIZE = 10 * 1024 * 1024;
const ALLOWED_ASSET_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getAssetExtension(file: File) {
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
    await requirePlatformSession();

    const formData = await request.formData();
    const file = formData.get("asset");
    const folder = String(formData.get("folder") ?? "site-content")
      .replace(/[^a-z0-9/-]/gi, "-")
      .replace(/\/+/g, "/")
      .replace(/^-|-$/g, "");

    if (!(file instanceof File)) {
      throw new AppError("Choose an image to upload.", 400);
    }

    if (!ALLOWED_ASSET_TYPES.has(file.type)) {
      throw new AppError("Upload a JPG, PNG, or WebP image.", 422);
    }

    if (file.size > MAX_ASSET_SIZE) {
      throw new AppError("Site images must be 10 MB or smaller.", 422);
    }

    const admin = createAdminSupabaseClient();
    const { error: bucketError } = await admin.storage.createBucket(SITE_MEDIA_BUCKET, {
      allowedMimeTypes: Array.from(ALLOWED_ASSET_TYPES),
      fileSizeLimit: MAX_ASSET_SIZE,
      public: true,
    });

    if (bucketError && !/already exists/i.test(bucketError.message)) {
      throw new AppError("Unable to prepare site media storage.", 500);
    }

    const extension = getAssetExtension(file);
    const assetPath = `${folder || "site-content"}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(SITE_MEDIA_BUCKET)
      .upload(assetPath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw new AppError("Unable to upload the site image.", 500);
    }

    const {
      data: { publicUrl },
    } = admin.storage.from(SITE_MEDIA_BUCKET).getPublicUrl(assetPath);

    return NextResponse.json({ publicUrl });
  } catch (error) {
    return createErrorResponse(error);
  }
}
