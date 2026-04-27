"use client";

import { FileUp, Paperclip } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export function FilePicker({
  accept,
  description,
  file,
  id,
  label,
  onChange,
}: {
  accept?: string;
  description: string;
  file: File | null;
  id: string;
  label: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700" htmlFor={id}>
        {label}
      </label>
      <label
        className={cn(
          "flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-5 text-center transition-all duration-200",
          file
            ? "border-[#C9A646]/55 bg-[#fdf9ed] shadow-[0_10px_24px_rgba(201,166,70,0.08)]"
            : "border-[#C9A646]/40 bg-[#F8FAFC] hover:border-[#C9A646] hover:bg-[#fdf9ed]",
        )}
        htmlFor={id}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
          {file ? <Paperclip className="h-4 w-4 text-[#B8933A]" /> : <FileUp className="h-4 w-4 text-[#B8933A]" />}
          <span>{file ? file.name : "Click to choose a file"}</span>
        </div>
        <span className="mt-1 text-xs leading-5 text-slate-500">{description}</span>
      </label>
      <input
        accept={accept}
        className="sr-only"
        id={id}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        type="file"
      />
    </div>
  );
}
