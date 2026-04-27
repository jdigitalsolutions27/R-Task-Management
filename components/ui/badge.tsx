import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

const badgeClasses = {
  approved: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  archived: "border border-slate-200 bg-slate-100 text-slate-700",
  completed: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border border-rose-200 bg-rose-50 text-rose-700",
  dismissed: "border border-rose-200 bg-rose-50 text-rose-700",
  draft: "border border-[#C9A646]/35 bg-[#C9A646]/12 text-[#8a6d2a]",
  filed: "border border-slate-200 bg-slate-100 text-slate-700",
  in_progress: "border border-sky-200 bg-sky-50 text-sky-700",
  inactive: "border border-slate-200 bg-slate-100 text-slate-700",
  open: "border border-sky-200 bg-sky-50 text-sky-700",
  pending: "border border-[#C9A646]/35 bg-[#C9A646]/12 text-[#8a6d2a]",
  published: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border border-rose-200 bg-rose-50 text-rose-700",
  resolved: "border border-emerald-200 bg-emerald-50 text-emerald-700",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof badgeClasses;
}

export function Badge({ className, tone = "pending", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize",
        badgeClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
