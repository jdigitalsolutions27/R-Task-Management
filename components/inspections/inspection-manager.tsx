"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useRealtimeRefresh } from "@/components/realtime/use-realtime-refresh";
import { FilePicker } from "@/components/ui/file-picker";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uploadManagedFile } from "@/lib/storage/browser-upload";
import { formatDateTime } from "@/lib/utils/format";
import {
  inspectionSchema,
  type InspectionInput,
} from "@/lib/validation/schemas";
import type { InspectionWithRelations, Property } from "@/types/app";

export function InspectionManager({
  canDelete,
  companyId,
  inspections,
  properties,
}: {
  canDelete: boolean;
  companyId: string;
  inspections: InspectionWithRelations[];
  properties: Property[];
}) {
  const router = useRouter();
  useRealtimeRefresh({
    channelName: `tenant-inspections-${companyId}`,
    subscriptions: [
      {
        event: "*",
        filter: `company_id=eq.${companyId}`,
        table: "inspections",
      },
    ],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [reportFileId, setReportFileId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<"newest" | "oldest">("newest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const form = useForm<InspectionInput>({
    defaultValues: {
      completedAt: "",
      propertyId: properties[0]?.id ?? "",
      reportFileId: "",
      scheduledFor: "",
      status: "scheduled",
      summary: "",
      title: "",
    },
    resolver: zodResolver(inspectionSchema),
  });

  const sortedProperties = useMemo(() => properties, [properties]);
  const filteredInspections = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return inspections
      .filter((item) => {
        const matchesSearch =
          !query ||
          [item.title, item.summary, item.property?.name, item.inspector?.full_name]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(query));
        const matchesStatus = statusFilter === "all" || item.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((first, second) => {
        const firstDate = new Date(first.completed_at || first.scheduled_for || first.created_at).getTime();
        const secondDate = new Date(second.completed_at || second.scheduled_for || second.created_at).getTime();

        return sortDirection === "newest" ? secondDate - firstDate : firstDate - secondDate;
      });
  }, [inspections, searchTerm, sortDirection, statusFilter]);

  function resetForm() {
    setEditingId(null);
    setPrimaryFile(null);
    setPhotoFile(null);
    setReportFileId("");
    setErrorMessage(null);
    setSuccessMessage(null);
    form.reset({
      completedAt: "",
      propertyId: properties[0]?.id ?? "",
      reportFileId: "",
      scheduledFor: "",
      status: "scheduled",
      summary: "",
      title: "",
    });
  }

  async function onSubmit(values: InspectionInput) {
    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let nextReportFileId = reportFileId || values.reportFileId || "";

      if (primaryFile) {
        const uploaded = await uploadManagedFile({
          category: "inspection",
          companyId,
          description: values.title,
          file: primaryFile,
          module: "inspections",
          propertyId: values.propertyId,
        });
        nextReportFileId = uploaded.id;
      }

      if (photoFile) {
        await uploadManagedFile({
          category: "photo",
          companyId,
          description: `${values.title} evidence`,
          file: photoFile,
          module: "inspections",
          propertyId: values.propertyId,
        });
      }

      const response = await fetch("/api/inspections", {
        body: JSON.stringify({
          ...values,
          id: editingId,
          reportFileId: nextReportFileId || "",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save the inspection.");
      }

      resetForm();
      setSuccessMessage(editingId ? "Inspection updated." : "Inspection created.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save the inspection.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this inspection record?")) {
      return;
    }

    const response = await fetch(`/api/inspections?id=${id}`, { method: "DELETE" });

    if (!response.ok) {
      return;
    }

    router.refresh();
  }

  function editInspection(item: InspectionWithRelations) {
    setEditingId(item.id);
    setReportFileId(item.report_file_id ?? "");
    form.reset({
      completedAt: item.completed_at ?? "",
      propertyId: item.property_id,
      reportFileId: item.report_file_id ?? "",
      scheduledFor: item.scheduled_for ?? "",
      status: item.status,
      summary: item.summary ?? "",
      title: item.title,
    });
  }

  return (
    <div className="space-y-6">
      <form id="create-inspection" className="grid gap-5 rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B8933A]">Inspection record</p>
          <h2 className="mt-1 text-xl font-bold text-[#111827]">
            {editingId ? "Edit inspection" : "Create inspection"}
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Title</label>
            <Input {...form.register("title")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Property</label>
            <Select {...form.register("propertyId")}>
              {sortedProperties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <Select {...form.register("status")}>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Scheduled for</label>
            <Input type="datetime-local" {...form.register("scheduledFor")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Completed at</label>
            <Input type="datetime-local" {...form.register("completedAt")} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Summary</label>
          <Textarea {...form.register("summary")} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <FilePicker
            description="Attach the main inspection report or completed form."
            file={primaryFile}
            id="inspection-primary-file"
            label="Primary report file"
            onChange={setPrimaryFile}
          />
          <FilePicker
            accept="image/*"
            description="Optional evidence photo for field documentation."
            file={photoFile}
            id="inspection-photo-file"
            label="Photo evidence"
            onChange={setPhotoFile}
          />
        </div>
        {errorMessage ? (
          <p className="app-status-banner app-status-banner-error">{errorMessage}</p>
        ) : null}
        {successMessage ? (
          <p className="app-status-banner app-status-banner-success">{successMessage}</p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={isPending} type="submit">
            {isPending ? "Saving..." : editingId ? "Update inspection" : "Create inspection"}
          </Button>
          {editingId ? (
            <Button onClick={resetForm} type="button" variant="outline">
              Cancel edit
            </Button>
          ) : null}
        </div>
      </form>

      {inspections.length ? (
        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]">
          <div className="app-table-toolbar">
            <label className="relative block">
              <span className="sr-only">Search inspections</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="app-filter-input"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search inspection, property, or inspector"
                value={searchTerm}
              />
            </label>
            <Select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="all">All statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <Select
              onChange={(event) => setSortDirection(event.target.value as "newest" | "oldest")}
              value={sortDirection}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="app-data-table">
              <thead>
                <tr>
                  <th>Inspection</th>
                  <th>Property</th>
                  <th>Inspector</th>
                  <th>Status</th>
                  <th>Timeline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInspections.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.summary ?? "No summary"}</p>
                    </td>
                    <td className="text-slate-600">{item.property?.name ?? "N/A"}</td>
                    <td className="text-slate-600">{item.inspector?.full_name ?? "N/A"}</td>
                    <td>
                      <Badge tone={item.status === "scheduled" ? "pending" : item.status}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="text-slate-600">
                      {formatDateTime(item.completed_at || item.scheduled_for)}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => editInspection(item)} size="sm" type="button" variant="outline">
                          Edit
                        </Button>
                        {item.report_file_id ? (
                          <a
                            className="inline-flex rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-semibold text-[#111827] shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A646] hover:bg-[#fdf9ed]"
                            href={`/api/files/${item.report_file_id}/download`}
                          >
                            Download report
                          </a>
                        ) : null}
                        {canDelete ? (
                          <Button onClick={() => handleDelete(item.id)} size="sm" type="button" variant="outline">
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filteredInspections.length ? (
            <div className="border-t border-[#E2E8F0] p-6">
              <EmptyState
                description="Try another search term, status, or sort order."
                title="No inspections match your filters"
              />
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title="No inspections available"
          description="Create scheduled or completed inspections and attach report evidence."
          action={
            <Button onClick={() => document.getElementById("create-inspection")?.scrollIntoView({ behavior: "smooth", block: "start" })} type="button" variant="outline">
              Create inspection
            </Button>
          }
        />
      )}
    </div>
  );
}
