"use client";

import Link from "next/link";
import { ChevronDown, History } from "lucide-react";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/format";
import type { DashboardActivityItem } from "@/types/app";

export function RecentActivityCard({
  activities,
  canViewHistory,
}: {
  activities: DashboardActivityItem[];
  canViewHistory: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleActivities = activities.slice(0, expanded ? 8 : 5);
  const hasMore = activities.length > 5;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Recent activity</CardTitle>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Latest workflow movement visible to your role.
          </p>
        </div>
        {canViewHistory ? (
          <Link
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#0F172A]/65 bg-white px-3 text-sm font-semibold text-[#111827] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A646] hover:bg-[#fdf9ed]"
            href="/history"
          >
            <History className="h-4 w-4" />
            History
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleActivities.length ? (
          visibleActivities.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 rounded-md border border-transparent px-3 py-3 transition-all duration-200 hover:border-[#E2E8F0] hover:bg-[#F8FAFC]"
            >
              <div className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#C9A646]" />
                <div>
                  <p className="font-semibold text-[#111827]">{item.label}</p>
                  <p className="text-sm leading-6 text-slate-500">{item.detail}</p>
                  {item.actorName ? (
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      Actor: {item.actorName}
                    </p>
                  ) : null}
                </div>
              </div>
              <p className="whitespace-nowrap text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-[#E2E8F0] bg-[#F8FAFC] px-4 py-8 text-center">
            <p className="font-semibold text-[#111827]">No recent activity yet</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your latest uploads, downloads, reports, and workflow actions will appear here.
            </p>
          </div>
        )}

        {hasMore ? (
          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] text-sm font-semibold text-[#111827] transition-all duration-200 hover:border-[#C9A646] hover:bg-[#fdf9ed]"
            onClick={() => setExpanded((current) => !current)}
            type="button"
          >
            {expanded ? "Show less" : "Show 3 more"}
            <ChevronDown className={cn("h-4 w-4 transition-transform", expanded ? "rotate-180" : "")} />
          </button>
        ) : null}
      </CardContent>
    </Card>
  );
}
