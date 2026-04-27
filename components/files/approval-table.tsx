"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquareText, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useRealtimeRefresh } from "@/components/realtime/use-realtime-refresh";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FilePreviewDialog } from "@/components/files/file-preview-dialog";
import { formatDateTime } from "@/lib/utils/format";
import type { FileWithRelations } from "@/types/app";

export function ApprovalTable({
  companyId,
  files,
}: {
  companyId: string | null;
  files: FileWithRelations[];
}) {
  const router = useRouter();
  const [reviewModal, setReviewModal] = useState<{
    file: FileWithRelations;
    status: "approved" | "rejected";
  } | null>(null);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileWithRelations | null>(null);
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const realtimeSubscriptions = useMemo(
    () =>
      companyId
        ? ([
            { event: "INSERT" as const, filter: `company_id=eq.${companyId}`, table: "files" as const },
            { event: "UPDATE" as const, filter: `company_id=eq.${companyId}`, table: "files" as const },
            { event: "DELETE" as const, filter: `company_id=eq.${companyId}`, table: "files" as const },
          ] as const)
        : [],
    [companyId],
  );
  useRealtimeRefresh({
    channelName: `approvals-${companyId ?? "tenant"}`,
    enabled: realtimeSubscriptions.length > 0,
    subscriptions: realtimeSubscriptions,
  });
  const showCompanyColumn = useMemo(
    () => new Set(files.map((file) => file.company?.id).filter(Boolean)).size > 1,
    [files],
  );
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
    const query = searchTerm.trim().toLowerCase();

    return files.filter((file) => {
      const matchesSearch =
        !query ||
        [
          file.original_name,
          file.description,
          file.property?.name,
          file.uploader?.full_name,
          file.company?.name,
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query));
      const matchesProperty = propertyFilter === "all" || file.property?.id === propertyFilter;

      return matchesSearch && matchesProperty;
    });
  }, [files, propertyFilter, searchTerm]);

  function openReviewModal(file: FileWithRelations, status: "approved" | "rejected") {
    setReviewModal({ file, status });
    setComment("");
    setReviewError(null);
  }

  async function reviewFile() {
    if (!reviewModal) {
      return;
    }

    const reviewComment = comment.trim();

    if (reviewModal.status === "rejected" && !reviewComment) {
      setReviewError("A rejection comment is required.");
      return;
    }

    setReviewError(null);
    setPendingId(reviewModal.file.id);
    const response = await fetch(`/api/files/${reviewModal.file.id}/status`, {
      body: JSON.stringify({ comment: reviewComment, status: reviewModal.status }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });

    setPendingId(null);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setReviewError(payload?.error ?? "Unable to update the file status.");
      return;
    }

    setReviewModal(null);
    setComment("");
    router.refresh();
  }

  if (!files.length) {
    return (
      <EmptyState
        title="Approval queue is clear"
        description="Pending files will surface here with approval and rejection controls."
        action={
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#C9A646] bg-[#C9A646] px-4 text-sm font-semibold text-[#111827] shadow-[0_12px_26px_rgba(201,166,70,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#B8933A]"
            href="/files"
          >
            Go to Files
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]">
        <div
          className="app-table-toolbar"
          style={{
            gridTemplateColumns: showCompanyColumn
              ? "minmax(0, 1.35fr) minmax(11rem, 0.8fr)"
              : "minmax(0, 1.35fr) minmax(11rem, 0.8fr)",
          }}
        >
          <label className="relative block">
            <span className="sr-only">Search approvals</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="app-filter-input"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search file, property, uploader, or company"
              value={searchTerm}
            />
          </label>
          <Select onChange={(event) => setPropertyFilter(event.target.value)} value={propertyFilter}>
            <option value="all">All properties</option>
            {propertyOptions.map((property) => (
              <option key={property?.id} value={property?.id}>
                {property?.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="app-data-table">
            <thead>
              <tr>
                {showCompanyColumn ? (
                  <th>Company</th>
                ) : null}
                <th>File</th>
                <th>Property</th>
                <th>Uploader</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr key={file.id} className="align-top">
                  {showCompanyColumn ? (
                    <td className="text-slate-600">{file.company?.name ?? "N/A"}</td>
                  ) : null}
                  <td>
                    <p className="font-medium text-slate-900">{file.original_name}</p>
                    <p className="text-xs text-slate-500">{file.description ?? "No description"}</p>
                    <p className="mt-1 text-xs text-slate-500">{file.mime_type}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button onClick={() => setPreviewFile(file)} size="sm" type="button" variant="outline">
                        View file
                      </Button>
                      <a
                        className="inline-flex h-9 items-center rounded-md border border-[#CBD5E1] bg-white px-3 text-xs font-semibold text-[#111827] shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A646] hover:bg-[#fdf9ed]"
                        href={`/api/files/${file.id}/download`}
                      >
                        Download
                      </a>
                    </div>
                  </td>
                  <td className="text-slate-600">{file.property?.name ?? "N/A"}</td>
                  <td className="text-slate-600">{file.uploader?.full_name ?? "N/A"}</td>
                  <td className="text-slate-600">{formatDateTime(file.created_at)}</td>
                  <td>
                    <Badge tone={file.status}>{file.status}</Badge>
                  </td>
                  <td>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        disabled={pendingId === file.id}
                        onClick={() => openReviewModal(file, "approved")}
                        type="button"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pendingId === file.id}
                        onClick={() => openReviewModal(file, "rejected")}
                        type="button"
                      >
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredFiles.length ? (
          <div className="border-t border-[#E2E8F0] p-6">
            <EmptyState
              description="Try a different property or keyword to find the approval item you need."
              title="No approvals match your filters"
            />
          </div>
        ) : null}
      </div>
      {previewFile ? (
        <FilePreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />
      ) : null}
      {reviewModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/55 px-4">
          <div className="w-full max-w-lg rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.3)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="mt-1 rounded-md bg-[#C9A646]/15 p-2 text-[#B8933A]">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">
                    {reviewModal.status === "approved" ? "Approve file" : "Reject file"}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Add a clear admin comment for {reviewModal.file.original_name}.
                  </p>
                </div>
              </div>
              <button
                aria-label="Close review modal"
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-[#F8FAFC] hover:text-[#111827]"
                onClick={() => setReviewModal(null)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-2">
              <label className="text-sm font-semibold text-[#111827]" htmlFor="review-comment">
                Admin comment
              </label>
              <Textarea
                id="review-comment"
                onChange={(event) => setComment(event.target.value)}
                placeholder={
                  reviewModal.status === "approved"
                    ? "Optional approval note"
                    : "Required rejection reason"
                }
                value={comment}
              />
            </div>

            {reviewError ? (
              <p className="app-status-banner app-status-banner-error mt-4">{reviewError}</p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <Button onClick={() => setReviewModal(null)} type="button" variant="outline">
                Cancel
              </Button>
              <Button
                disabled={pendingId === reviewModal.file.id}
                onClick={reviewFile}
                type="button"
                variant={reviewModal.status === "rejected" ? "danger" : "default"}
              >
                {pendingId === reviewModal.file.id
                  ? "Saving..."
                  : reviewModal.status === "approved"
                    ? "Approve file"
                    : "Reject file"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
