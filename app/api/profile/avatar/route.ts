import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { AppError, createErrorResponse } from "@/lib/utils/http";
import { resolveRequestContext } from "@/lib/db/context";

const AVATAR_BUCKET = "rtask-avatars";
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getAvatarExtension(file: File) {
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

    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      throw new AppError("Choose an image to upload.", 400);
    }

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      throw new AppError("Upload a JPG, PNG, or WebP image.", 422);
    }

    if (file.size > MAX_AVATAR_SIZE) {
      throw new AppError("Profile image must be 5 MB or smaller.", 422);
    }

    const admin = createAdminSupabaseClient();
    const { error: bucketError } = await admin.storage.createBucket(AVATAR_BUCKET, {
      allowedMimeTypes: Array.from(ALLOWED_AVATAR_TYPES),
      fileSizeLimit: MAX_AVATAR_SIZE,
      public: true,
    });

    if (bucketError && !/already exists/i.test(bucketError.message)) {
      throw new AppError("Unable to prepare profile image storage.", 500);
    }

    const extension = getAvatarExtension(file);
    const storagePath = `${context.profile.id}/avatar-${Date.now()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(AVATAR_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw new AppError("Unable to upload your profile image.", 500);
    }

    const {
      data: { publicUrl },
    } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath);

    const { data, error: updateError } = await admin
      .from("users")
      .update({ avatar_url: publicUrl })
      .eq("id", context.profile.id)
      .select("*")
      .single();

    if (updateError) {
      throw new AppError("Unable to save your profile image.", 500);
    }

    const { error: metadataError } = await admin.auth.admin.updateUserById(context.profile.id, {
      user_metadata: {
        ...context.authUser.user_metadata,
        avatar_url: publicUrl,
      },
    });

    if (metadataError) {
      throw new AppError("Profile image saved, but account metadata could not be updated.", 500);
    }

    return NextResponse.json({ data, avatarUrl: publicUrl });
  } catch (error) {
    return createErrorResponse(error);
  }
}
