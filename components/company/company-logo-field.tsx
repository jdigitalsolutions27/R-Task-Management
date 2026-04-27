"use client";

import { Camera, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { CompanyLogoMark } from "@/components/company/company-logo-mark";
import { Button } from "@/components/ui/button";

export function CompanyLogoField({
  companyId,
  companyName,
  description,
  disabled = false,
  onChange,
  value,
}: {
  companyId?: string | null;
  companyName: string;
  description: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleFileChange(file: File | null) {
    if (!file) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("asset", file);

      if (companyId) {
        formData.append("companyId", companyId);
      }

      const response = await fetch("/api/company/logo", {
        body: formData,
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to upload the company logo.");
      }

      onChange(payload.logoUrl);
      setSuccessMessage("Company logo uploaded.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to upload the company logo.");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }

      setIsUploading(false);
    }
  }

  return (
    <div className="grid gap-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 md:grid-cols-[auto_1fr] md:items-center">
      <CompanyLogoMark companyName={companyName || "Company"} logoUrl={value || null} size="lg" />
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-[#111827]">Company logo</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={disabled || isUploading}
            id={`company-logo-${companyId ?? "draft"}`}
            onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
            type="file"
          />
          <Button
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
            type="button"
            variant="outline"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {isUploading ? "Uploading..." : value ? "Replace logo" : "Upload logo"}
          </Button>
          {value ? (
            <Button
              disabled={disabled || isUploading}
              onClick={() => {
                setErrorMessage(null);
                setSuccessMessage("Company logo removed. Save the form to apply this change.");
                onChange("");
              }}
              type="button"
              variant="ghost"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          ) : null}
        </div>
        {errorMessage ? <p className="text-sm font-medium text-rose-600">{errorMessage}</p> : null}
        {successMessage ? <p className="text-sm font-medium text-emerald-700">{successMessage}</p> : null}
      </div>
    </div>
  );
}
