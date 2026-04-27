"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { buildStoragePath, createResumableUpload } from "@/lib/storage/tus";
import type { FileCategory, ModuleKind } from "@/types/app";

interface UploadManagedFileOptions {
  category: FileCategory;
  companyId: string;
  description?: string;
  file: File;
  module: ModuleKind;
  propertyId: string;
}

export async function uploadManagedFile({
  category,
  companyId,
  description,
  file,
  module,
  propertyId,
}: UploadManagedFileOptions) {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Your session has expired. Sign in again to continue.");
  }

  const storagePath = buildStoragePath({
    category,
    companyId,
    fileName: file.name,
    propertyId,
  });

  await new Promise<void>((resolve, reject) => {
    const upload = createResumableUpload({
      accessToken: session.access_token,
      file,
      onError: reject,
      onSuccess: resolve,
      storagePath,
    });

    upload.start();
  });

  const response = await fetch("/api/files", {
    body: JSON.stringify({
      category,
      description,
      fileName: file.name,
      mimeType: file.type,
      module,
      originalName: file.name,
      propertyId,
      sizeBytes: file.size,
      storagePath,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to register the uploaded file.");
  }

  return payload.data as { id: string; original_name: string };
}
