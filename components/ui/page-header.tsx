import type { ReactNode } from "react";

export function PageHeader({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_100%)] px-5 py-5 shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)] md:flex-row md:items-end md:justify-between md:px-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#111827] sm:text-[2rem]">{title}</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-[0.95rem]">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
