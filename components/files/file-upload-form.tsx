"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FilePicker } from "@/components/ui/file-picker";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { uploadManagedFile } from "@/lib/storage/browser-upload";
import { type Property } from "@/types/app";

type FileUploadValues = {
  category: "general" | "photo" | "video" | "pdf";
  description?: string;
  propertyId: string;
};

export function FileUploadForm({
  companyId,
  properties,
}: {
  companyId: string;
  properties: Property[];
}) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const form = useForm<FileUploadValues>({
    defaultValues: {
      category: "general",
      description: "",
      propertyId: properties[0]?.id ?? "",
    },
  });

  async function onSubmit(values: FileUploadValues) {
    if (!selectedFile) {
      setErrorMessage("Choose a file before uploading.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUploading(true);

    try {
      await uploadManagedFile({
        category: values.category,
        companyId,
        description: values.description,
        file: selectedFile,
        module: "files",
        propertyId: values.propertyId,
      });
      form.reset({
        category: "general",
        description: "",
        propertyId: values.propertyId,
      });
      setSelectedFile(null);
      setSuccessMessage("File uploaded successfully. The review team has been notified.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to upload the file.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_auto]" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2 lg:col-span-2">
        <FilePicker
          description="Documents, images, and video evidence are supported."
          file={selectedFile}
          id="file-input"
          label="Select file"
          onChange={setSelectedFile}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Property</label>
        <Select {...form.register("propertyId")}>
          {properties.map((property) => (
            <option value={property.id} key={property.id}>
              {property.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Category</label>
        <Select {...form.register("category")}>
          <option value="general">General</option>
          <option value="photo">Photo</option>
          <option value="video">Video</option>
          <option value="pdf">PDF</option>
        </Select>
      </div>
      <div className="space-y-2 lg:col-span-3">
        <label className="text-sm font-medium text-slate-700">Description</label>
        <Input {...form.register("description")} placeholder="Optional context for reviewers" />
      </div>
      <div className="flex items-end">
        <Button className="w-full" disabled={isUploading} type="submit">
          {isUploading ? "Uploading..." : "Upload file"}
        </Button>
      </div>
      {errorMessage ? (
        <p className="lg:col-span-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="lg:col-span-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}
    </form>
  );
}
