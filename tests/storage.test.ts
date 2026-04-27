import { beforeEach, describe, expect, it, vi } from "vitest";

const uploadSpy = vi.fn();

vi.mock("tus-js-client", () => ({
  Upload: vi.fn(function Upload(file, options) {
    uploadSpy(file, options);
    return { file, options };
  }),
}));

import {
  buildStoragePath,
  createResumableUpload,
  validateUploadFile,
} from "@/lib/storage/tus";

describe("storage upload rules", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET = "rtask-private";
    uploadSpy.mockClear();
  });

  it("accepts supported small uploads", () => {
    const file = new File(["lease"], "lease.pdf", { type: "application/pdf" });

    expect(() => validateUploadFile(file)).not.toThrow();
  });

  it("rejects files over 1 GB", () => {
    const largeFile = { size: 1024 * 1024 * 1024 + 1, type: "video/mp4" } as File;

    expect(() => validateUploadFile(largeFile)).toThrow("Files may not exceed 1 GB.");
  });

  it("builds tenant-prefixed storage paths", () => {
    const path = buildStoragePath({
      category: "inspection",
      companyId: "company-1",
      fileName: "Exterior Photo.JPG",
      propertyId: "property-9",
    });

    expect(path).toMatch(/^company-1\/property-9\/inspection\//);
    expect(path).toContain("exterior-photo.jpg");
  });

  it("creates resumable upload options for browser chunking", () => {
    const file = new File(["video"], "walkthrough.mp4", { type: "video/mp4" });

    createResumableUpload({
      accessToken: "token-123",
      file,
      storagePath: "company/property/video/walkthrough.mp4",
    });

    expect(uploadSpy).toHaveBeenCalledTimes(1);
    const [, options] = uploadSpy.mock.calls[0];
    expect(options.endpoint).toBe("https://example.supabase.co/storage/v1/upload/resumable");
    expect(options.chunkSize).toBe(6 * 1024 * 1024);
    expect(options.headers.authorization).toBe("Bearer token-123");
    expect(options.metadata.bucketName).toBe("rtask-private");
  });
});
