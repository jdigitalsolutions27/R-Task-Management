"use client";

import Image from "next/image";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FileWithRelations } from "@/types/app";

export function FilePreviewDialog({
  file,
  onClose,
}: {
  file: FileWithRelations;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-6">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-md bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#e7e0d8] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{file.original_name}</h2>
            <p className="text-sm text-slate-500">
              {file.company?.name ?? "N/A"} | {file.property?.name ?? "N/A"} | {file.mime_type}
            </p>
          </div>
          <Button aria-label="Close preview" onClick={onClose} size="sm" type="button" variant="outline">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto bg-[#f7f5f2] p-5">
          <FilePreview file={file} />
        </div>
      </div>
    </div>
  );
}

function FilePreview({ file }: { file: FileWithRelations }) {
  const previewUrl = `/api/files/${file.id}/preview`;

  if (file.mime_type.startsWith("image/")) {
    return (
      <div className="relative mx-auto min-h-[26rem] w-full max-w-5xl overflow-hidden rounded-md">
        <Image
          alt={file.original_name}
          className="object-contain"
          fill
          sizes="(max-width: 1024px) 100vw, 960px"
          src={previewUrl}
          unoptimized
        />
      </div>
    );
  }

  if (file.mime_type === "application/pdf") {
    return (
      <iframe
        className="h-full min-h-[70vh] w-full rounded-md border border-[#ddd6ce] bg-white"
        src={previewUrl}
        title={file.original_name}
      />
    );
  }

  if (file.mime_type.startsWith("video/")) {
    return (
      <video
        className="mx-auto max-h-[75vh] w-full rounded-md bg-black"
        controls
        preload="metadata"
        src={previewUrl}
      />
    );
  }

  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-4 rounded-md border border-dashed border-[#d6d3d1] bg-white p-6 text-center">
      <div>
        <p className="font-medium text-slate-900">Preview is not available for this file type.</p>
        <p className="text-sm text-slate-500">{file.mime_type}</p>
      </div>
      <a
        className="inline-flex h-10 items-center rounded-md border border-[#CBD5E1] bg-white px-4 text-sm font-semibold text-[#111827] shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A646] hover:bg-[#fdf9ed] hover:shadow-[0_16px_30px_rgba(15,23,42,0.1)]"
        href={`/api/files/${file.id}/download`}
      >
        Download file
      </a>
    </div>
  );
}
