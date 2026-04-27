"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MoreHorizontal, Search, X } from "lucide-react";

import { FilePreviewDialog } from "@/components/files/file-preview-dialog";
import { useRealtimeRefresh } from "@/components/realtime/use-realtime-refresh";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatBytes, formatDateTime } from "@/lib/utils/format";
import type { FileWithRelations } from "@/types/app";

export function FileTable({
  canDeleteAny,
  companyId,
  currentUserId,
  files,
  realtimeScope,
}: {
  canDeleteAny: boolean;
  companyId: string | null;
  currentUserId: string;
  files: FileWithRelations[];
  realtimeScope: "company" | "user";
}) {
  const router = useRouter();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileWithRelations | null>(null);
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<"newest" | "oldest">("newest");
  const [statusFilter, setStatusFilter] = useState("all");
  const realtimeFilter = useMemo(
    () =>
      realtimeScope === "company"
        ? companyId
          ? `company_id=eq.${companyId}`
          : null
        : `uploader_id=eq.${currentUserId}`,
    [companyId, currentUserId, realtimeScope],
  );
  const realtimeSubscriptions = useMemo(
    () =>
      realtimeFilter
        ? ([
            { event: "INSERT" as const, filter: realtimeFilter, table: "files" as const },
            { event: "UPDATE" as const, filter: realtimeFilter, table: "files" as const },
            { event: "DELETE" as const, filter: realtimeFilter, table: "files" as const },
          ] as const)
        : [],
    [realtimeFilter],
  );

  useRealtimeRefresh({
    channelName: `files-table-${realtimeScope}-${companyId ?? currentUserId}`,
    enabled: realtimeSubscriptions.length > 0,
    subscriptions: realtimeSubscriptions,
  });

  const propertyOptions = useMemo(
    () =>
      Array.from(
        new Map(
          files
            .filter((file) => file.property)
            .map((file) => [file.property?.id, file.property]),
        ).values(),
      ),
    [files],
  );

  const filteredFiles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return files
      .filter((file) => {
        const matchesSearch =
          !normalizedSearch ||
          [
            file.original_name,
            file.description,
            file.property?.name,
            file.uploader?.full_name,
            file.module,
          ]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(normalizedSearch));
        const matchesStatus = statusFilter === "all" || file.status === statusFilter;
        const matchesProperty =
          propertyFilter === "all" || file.property?.id === propertyFilter;

        return matchesSearch && matchesStatus && matchesProperty;
      })
      .sort((first, second) => {
        const firstDate = new Date(first.created_at).getTime();
        const secondDate = new Date(second.created_at).getTime();

        return sortDirection === "newest" ? secondDate - firstDate : firstDate - secondDate;
      });
  }, [files, propertyFilter, searchTerm, sortDirection, statusFilter]);

  async function handleDelete(id: string) {
    setDeleteError(null);

    setPendingId(id);
    const response = await fetch(`/api/files?id=${id}`, { method: "DELETE" });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setDeleteError(payload?.error ?? "Unable to delete this file.");
      setPendingId(null);
      return;
    }

    setConfirmDeleteId(null);
    setPendingId(null);
    router.refresh();
  }

  if (!files.length) {
    return (
      <EmptyState
        title="No files uploaded yet"
        description="Uploaded files, approval states, and downloads will appear here."
        action={
          <Button onClick={() => window.scrollTo({ behavior: "smooth", top: 0 })} type="button" variant="outline">
            Upload your first file
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]">
        <div className="app-table-toolbar lg:grid-cols-[1.4fr_0.75fr_0.85fr_0.75fr]">
          <label className="relative">
            <span className="sr-only">Search files</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="app-filter-input"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search file, property, or uploader"
              value={searchTerm}
            />
          </label>
          <Select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
          <Select onChange={(event) => setPropertyFilter(event.target.value)} value={propertyFilter}>
            <option value="all">All properties</option>
            {propertyOptions.map((property) => (
              <option key={property?.id} value={property?.id}>
                {property?.name}
              </option>
            ))}
          </Select>
          <Select onChange={(event) => setSortDirection(event.target.value as "newest" | "oldest")} value={sortDirection}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="app-data-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Property</th>
                <th>Uploader</th>
                <th>Status</th>
                <th>Admin comment</th>
                <th>Size</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => {
                const reviewComment =
                  file.latestReview?.comment ?? file.rejection_comment;
                const hasReview =
                  file.latestReview !== null ||
                  (file.status === "rejected" && Boolean(file.rejection_comment));
                const canDeleteFile =
                  canDeleteAny ||
                  (file.uploader?.id === currentUserId &&
                    (file.status === "pending" || file.status === "rejected"));

                return (
                  <tr key={file.id} className="align-top">
                    <td>
                      <p className="font-medium text-slate-900">{file.original_name}</p>
                      <p className="text-xs text-slate-500">{file.module.replace("_", " ")}</p>
                    </td>
                    <td className="text-slate-600">{file.property?.name ?? "N/A"}</td>
                    <td className="text-slate-600">{file.uploader?.full_name ?? "N/A"}</td>
                    <td>
                      <Badge tone={file.status}>{file.status}</Badge>
                    </td>
                    <td className="max-w-xs text-slate-600">
                      {hasReview ? (
                        <div className="space-y-1">
                          <p className="font-medium text-slate-900">
                            {reviewComment || "No admin comment provided."}
                          </p>
                          {file.latestReview ? (
                            <p className="text-xs text-slate-500">
                              {file.latestReview.status} by{" "}
                              {file.latestReview.reviewer?.full_name ?? "Admin"} on{" "}
                              {formatDateTime(file.latestReview.createdAt)}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-400">Pending review</span>
                      )}
                    </td>
                    <td className="text-slate-600">{formatBytes(file.size_bytes)}</td>
                    <td className="text-slate-600">{formatDateTime(file.created_at)}</td>
                    <td>
                      <details className="relative">
                        <summary className="inline-flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#111827] transition-all hover:border-[#C9A646] hover:bg-[#fdf9ed]">
                          <MoreHorizontal className="h-4 w-4" />
                          Actions
                        </summary>
                        <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white p-1 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.5)]">
                          <button
                            className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-[#F8FAFC]"
                            onClick={() => setPreviewFile(file)}
                            type="button"
                          >
                            View
                          </button>
                          <a
                            className="block rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-[#F8FAFC]"
                            href={`/api/files/${file.id}/download`}
                          >
                            Download
                          </a>
                          {canDeleteFile ? (
                            <button
                              className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
                              disabled={pendingId === file.id}
                              onClick={() => setConfirmDeleteId(file.id)}
                              type="button"
                            >
                              {pendingId === file.id ? "Deleting..." : "Delete"}
                            </button>
                          ) : null}
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filteredFiles.length ? (
          <div className="border-t border-[#E2E8F0] p-6">
            <EmptyState
              title="No files match your filters"
              description="Try adjusting the search term, approval status, property, or date sort."
            />
          </div>
        ) : null}
      </div>
      {previewFile ? <FilePreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} /> : null}
      {confirmDeleteId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/55 px-4">
          <div className="w-full max-w-md rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.3)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#111827]">Delete this file?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This removes the file record and stored object. This action cannot be undone.
                </p>
              </div>
              <button
                aria-label="Close delete confirmation"
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-[#F8FAFC] hover:text-[#111827]"
                onClick={() => setConfirmDeleteId(null)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {deleteError ? (
              <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {deleteError}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <Button onClick={() => setConfirmDeleteId(null)} type="button" variant="outline">
                Cancel
              </Button>
              <Button
                disabled={pendingId === confirmDeleteId}
                onClick={() => handleDelete(confirmDeleteId)}
                type="button"
                variant="danger"
              >
                {pendingId === confirmDeleteId ? "Deleting..." : "Delete file"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
