import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d6d3d1] bg-[linear-gradient(180deg,#fffdf9_0%,#fcfbf8_100%)] px-6 py-12 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <div className="mb-4 rounded-xl border border-[#C9A646]/25 bg-[#C9A646]/12 p-3 text-[#B8933A] shadow-[0_10px_24px_rgba(201,166,70,0.12)]">
        <Inbox className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold text-[#111827]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
