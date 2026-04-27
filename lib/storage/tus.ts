import * as tus from "tus-js-client";

import { getStorageBucket, getSupabaseUrl } from "@/lib/utils/env";

const MAX_FILE_BYTES = 1024 * 1024 * 1024;
const SUPPORTED_MIME_PREFIXES = ["image/", "video/"];
const SUPPORTED_MIME_TYPES = ["application/pdf"];

export function isSupportedFileType(file: File) {
  return (
    SUPPORTED_MIME_TYPES.includes(file.type) ||
    SUPPORTED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix))
  );
}

export function validateUploadFile(file: File) {
  if (!isSupportedFileType(file)) {
    throw new Error("Only PDF, image, and video uploads are supported.");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Files may not exceed 1 GB.");
  }
}

export function sanitizeFileName(fileName: string) {
  const extensionIndex = fileName.lastIndexOf(".");
  const extension = extensionIndex >= 0 ? fileName.slice(extensionIndex) : "";
  const base = extensionIndex >= 0 ? fileName.slice(0, extensionIndex) : fileName;

  const sanitizedBase = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${sanitizedBase || "file"}${extension.toLowerCase()}`;
}

export function buildStoragePath({
  companyId,
  propertyId,
  category,
  fileName,
}: {
  category: string;
  companyId: string;
  fileName: string;
  propertyId: string;
}) {
  const timestamp = Date.now();
  return `${companyId}/${propertyId}/${category}/${timestamp}-${sanitizeFileName(fileName)}`;
}

interface CreateUploadOptions {
  accessToken: string;
  file: File;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
  onSuccess?: () => void;
  storagePath: string;
}

export function createResumableUpload(options: CreateUploadOptions) {
  validateUploadFile(options.file);

  return new tus.Upload(options.file, {
    endpoint: `${getSupabaseUrl()}/storage/v1/upload/resumable`,
    headers: {
      authorization: `Bearer ${options.accessToken}`,
      "x-upsert": "false",
    },
    metadata: {
      bucketName: getStorageBucket(),
      cacheControl: "3600",
      contentType: options.file.type,
      objectName: options.storagePath,
    },
    uploadDataDuringCreation: true,
    removeFingerprintOnSuccess: true,
    chunkSize: 6 * 1024 * 1024,
    retryDelays: [0, 1000, 3000, 5000, 10000],
    onError(error) {
      options.onError?.(error);
    },
    onProgress(bytesUploaded, bytesTotal) {
      options.onProgress?.(bytesTotal ? bytesUploaded / bytesTotal : 0);
    },
    onSuccess() {
      options.onSuccess?.();
    },
  });
}

