"use client";

import { ChevronDown, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/format";
import type { ActivityHistoryItem } from "@/types/app";

function getReadableDetails(item: ActivityHistoryItem) {
  const metadata = item.metadata;

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const details: string[] = [];

  if ("comment" in metadata && typeof metadata.comment === "string" && metadata.comment.trim()) {
    details.push(`Comment: ${metadata.comment}`);
  }

  if ("module" in metadata && typeof metadata.module === "string") {
    details.push(`Module: ${metadata.module.replace(/_/g, " ")}`);
  }

  return details.length ? details : null;
}

export function ActivityHistoryTable({
  activities,
  canManage,
}: {
  activities: ActivityHistoryItem[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const visibleActivities = activities.slice(0, visibleCount);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const visibleIds = visibleActivities.map((item) => item.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  function toggleVisibleSelection() {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return [...new Set([...current, ...visibleIds])];
    });
  }

  async function deleteHistoryItems(ids: string[]) {
    if (!ids.length) {
      setErrorMessage("Choose at least one history item to delete.");
      return;
    }

    const confirmed = window.confirm(
      ids.length === 1
        ? "Delete this history item?"
        : `Delete ${ids.length} selected history items?`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setPendingIds(ids);

    try {
      const response = await fetch("/api/history", {
        body: JSON.stringify({ ids }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete history.");
      }

      setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete history.");
    } finally {
      setPendingIds([]);
    }
  }

  if (!activities.length) {
    return (
      <EmptyState
        title="No history yet"
        description="Full audit history will appear here after workflow activity is recorded."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#111827]">
              Showing {visibleActivities.length} of {activities.length} history items
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Start with the 10 latest records, then reveal older activity as needed.
            </p>
          </div>
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={!selectedIds.length || pendingIds.length > 0}
                onClick={() => deleteHistoryItems(selectedIds)}
                type="button"
                variant="danger"
              >
                <Trash2 className="h-4 w-4" />
                {pendingIds.length ? "Deleting..." : `Delete selected (${selectedIds.length})`}
              </Button>
            </div>
          ) : null}
        </div>
        {errorMessage ? (
          <p className="mx-4 mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                {canManage ? (
                  <th className="px-4 py-3 font-medium">
                    <input
                      aria-label="Select visible history items"
                      checked={allVisibleSelected}
                      className="h-4 w-4 accent-[#C9A646]"
                      onChange={toggleVisibleSelection}
                      type="checkbox"
                    />
                  </th>
                ) : null}
                <th className="px-4 py-3 font-medium">Activity</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Details</th>
                {canManage ? <th className="px-4 py-3 font-medium">Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {visibleActivities.map((item) => (
                <tr className="border-t border-[#E2E8F0] align-top" key={item.id}>
                  {canManage ? (
                    <td className="px-4 py-3">
                      <input
                        aria-label={`Select ${item.label}`}
                        checked={selectedSet.has(item.id)}
                        className="h-4 w-4 accent-[#C9A646]"
                        onChange={() => toggleSelection(item.id)}
                        type="checkbox"
                      />
                    </td>
                  ) : null}
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#111827]">{item.label}</p>
                    <p className="text-xs leading-5 text-slate-500">{item.detail}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.actorName ?? "System"}</td>
                  <td className="px-4 py-3 text-slate-600">{item.entityType}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(item.createdAt)}</td>
                  <td className="max-w-sm px-4 py-3 text-slate-600">
                    {getReadableDetails(item) ? (
                      <div className="space-y-1">
                        {getReadableDetails(item)?.map((detail) => (
                          <p className="text-sm leading-6" key={detail}>
                            {detail}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">No additional details</span>
                    )}
                  </td>
                  {canManage ? (
                    <td className="px-4 py-3">
                      <Button
                        disabled={pendingIds.includes(item.id)}
                        onClick={() => deleteHistoryItems([item.id])}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
      {visibleCount < activities.length ? (
        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#E2E8F0] bg-white text-sm font-semibold text-[#111827] shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A646] hover:bg-[#fdf9ed]"
          onClick={() => setVisibleCount((current) => Math.min(current + 10, activities.length))}
          type="button"
        >
          Show 10 more
          <ChevronDown
            className={cn("h-4 w-4", visibleCount + 10 >= activities.length ? "opacity-70" : "")}
          />
        </button>
      ) : null}
    </div>
  );
}
