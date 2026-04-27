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
import { formatDate } from "@/lib/utils/format";
import { reportSchema, type ReportInput } from "@/lib/validation/schemas";
import type { Property, ReportWithRelations } from "@/types/app";

export function ReportManager({
  canDelete,
  companyId,
  properties,
  reports,
}: {
  canDelete: boolean;
  companyId: string;
  properties: Property[];
  reports: ReportWithRelations[];
}) {
  const router = useRouter();
  useRealtimeRefresh({
    channelName: `tenant-reports-${companyId}`,
    subscriptions: [
      {
        event: "*",
        filter: `company_id=eq.${companyId}`,
        table: "reports",
      },
    ],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [reportFileId, setReportFileId] = useState<string>("");
  const [videoFileId, setVideoFileId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<"newest" | "oldest">("newest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const form = useForm<ReportInput>({
    defaultValues: {
      description: "",
      propertyId: properties[0]?.id ?? "",
      reportDate: new Date().toISOString().slice(0, 10),
      reportFileId: "",
      status: "draft",
      title: "",
      videoFileId: "",
    },
    resolver: zodResolver(reportSchema),
  });

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return reports
      .filter((item) => {
        const matchesSearch =
          !query ||
          [item.title, item.description, item.property?.name, item.author?.full_name]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(query));
        const matchesStatus = statusFilter === "all" || item.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((first, second) => {
        const firstDate = new Date(first.report_date).getTime();
        const secondDate = new Date(second.report_date).getTime();

        return sortDirection === "newest" ? secondDate - firstDate : firstDate - secondDate;
      });
  }, [reports, searchTerm, sortDirection, statusFilter]);

  function resetForm() {
    setEditingId(null);
    setReportFile(null);
    setVideoFile(null);
    setReportFileId("");
    setVideoFileId("");
    setErrorMessage(null);
    setSuccessMessage(null);
    form.reset({
      description: "",
      propertyId: properties[0]?.id ?? "",
      reportDate: new Date().toISOString().slice(0, 10),
      reportFileId: "",
      status: "draft",
      title: "",
      videoFileId: "",
    });
  }

  async function onSubmit(values: ReportInput) {
    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let nextReportFileId = reportFileId || values.reportFileId;
      let nextVideoFileId = videoFileId || values.videoFileId || "";

      if (reportFile) {
        const uploaded = await uploadManagedFile({
          category: "shopping_report",
          companyId,
          description: values.title,
          file: reportFile,
          module: "shopping_reports",
          propertyId: values.propertyId,
        });
        nextReportFileId = uploaded.id;
      }

      if (videoFile) {
        const uploaded = await uploadManagedFile({
          category: "video",
          companyId,
          description: `${values.title} video`,
          file: videoFile,
          module: "shopping_reports",
          propertyId: values.propertyId,
        });
        nextVideoFileId = uploaded.id;
      }

      const response = await fetch("/api/shopping-reports", {
        body: JSON.stringify({
          ...values,
          id: editingId,
          reportFileId: nextReportFileId,
          videoFileId: nextVideoFileId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save the shopping report.");
      }

      resetForm();
      setSuccessMessage(editingId ? "Report updated." : "Report created.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save the shopping report.");
    } finally {
      setIsPending(false);
    }
  }

  function editReport(item: ReportWithRelations) {
    setEditingId(item.id);
    setReportFileId(item.report_file_id);
    setVideoFileId(item.video_file_id ?? "");
    form.reset({
      description: item.description ?? "",
      propertyId: item.property_id,
      reportDate: item.report_date,
      reportFileId: item.report_file_id,
      status: item.status,
      title: item.title,
      videoFileId: item.video_file_id ?? "",
    });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this shopping report?")) {
      return;
    }

    const response = await fetch(`/api/shopping-reports?id=${id}`, { method: "DELETE" });

    if (!response.ok) {
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form id="create-report" className="grid gap-5 rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B8933A]">Report package</p>
          <h2 className="mt-1 text-xl font-bold text-[#111827]">
            {editingId ? "Edit shopping report" : "Create shopping report"}
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
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Report date</label>
            <Input type="date" {...form.register("reportDate")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <Select {...form.register("status")}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Description</label>
          <Textarea {...form.register("description")} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <FilePicker
            description="Upload the primary report document for client delivery."
            file={reportFile}
            id="report-primary-file"
            label="Report file"
            onChange={setReportFile}
          />
          <FilePicker
            accept="video/*"
            description="Optional supporting video evidence for the report package."
            file={videoFile}
            id="report-video-file"
            label="Video file"
            onChange={setVideoFile}
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
            {isPending ? "Saving..." : editingId ? "Update report" : "Create report"}
          </Button>
          {editingId ? (
            <Button onClick={resetForm} type="button" variant="outline">
              Cancel edit
            </Button>
          ) : null}
        </div>
      </form>

      {reports.length ? (
        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]">
          <div className="app-table-toolbar">
            <label className="relative block">
              <span className="sr-only">Search reports</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="app-filter-input"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search report, property, or author"
                value={searchTerm}
              />
            </label>
            <Select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
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
                  <th>Report</th>
                  <th>Property</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.author?.full_name ?? "N/A"}</p>
                    </td>
                    <td className="text-slate-600">{item.property?.name ?? "N/A"}</td>
                    <td>
                      <Badge tone={item.status === "published" ? "approved" : item.status}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="text-slate-600">{formatDate(item.report_date)}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => editReport(item)} size="sm" type="button" variant="outline">
                          Edit
                        </Button>
                        <a
                          className="inline-flex rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-semibold text-[#111827] shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A646] hover:bg-[#fdf9ed]"
                          href={`/api/files/${item.report_file_id}/download`}
                        >
                          Download report
                        </a>
                        {item.video_file_id ? (
                          <a
                            className="inline-flex rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-semibold text-[#111827] shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A646] hover:bg-[#fdf9ed]"
                            href={`/api/files/${item.video_file_id}/download`}
                          >
                            Download video
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
          {!filteredReports.length ? (
            <div className="border-t border-[#E2E8F0] p-6">
              <EmptyState
                description="Try another search term or status to find the report you need."
                title="No reports match your filters"
              />
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title="No shopping reports yet"
          description="Publish reports and associated video evidence for company delivery."
          action={
            <Button onClick={() => document.getElementById("create-report")?.scrollIntoView({ behavior: "smooth", block: "start" })} type="button" variant="outline">
              Create report
            </Button>
          }
        />
      )}
    </div>
  );
}
