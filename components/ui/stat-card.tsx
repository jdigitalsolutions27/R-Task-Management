import type { ReactNode } from "react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  href,
  icon,
  label,
  trend,
  value,
}: {
  href?: string;
  icon: ReactNode;
  label: string;
  trend?: string;
  value: string | number;
}) {
  const card = (
    <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A646]/40 hover:shadow-[0_22px_55px_-38px_rgba(11,19,43,0.65)]">
      <CardContent className="flex h-full items-start justify-between gap-4 p-6">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-[#111827]">{value}</p>
          {trend ? (
            <p className="mt-3 text-xs font-medium text-slate-500">{trend}</p>
          ) : null}
        </div>
        <div className="rounded-md bg-[#C9A646]/15 p-3 text-[#B8933A]">{icon}</div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link className="block rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C9A646]/25" href={href}>
        {card}
      </Link>
    );
  }

  return card;
}
