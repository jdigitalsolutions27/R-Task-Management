"use client";

import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { initialsFromName } from "@/lib/utils/format";

const sizeClasses = {
  lg: "h-16 w-16 rounded-2xl text-lg",
  md: "h-12 w-12 rounded-xl text-sm",
  sm: "h-10 w-10 rounded-lg text-xs",
} as const;

export function CompanyLogoMark({
  className,
  companyName,
  logoUrl,
  size = "md",
}: {
  className?: string;
  companyName: string;
  logoUrl?: string | null;
  size?: keyof typeof sizeClasses;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border border-[#C9A646]/25 bg-[#F8FAFC] bg-cover bg-center font-bold uppercase text-[#0F172A] shadow-[0_10px_26px_rgba(15,23,42,0.1)]",
        sizeClasses[size],
        className,
      )}
      style={logoUrl ? { backgroundImage: `url(${logoUrl})` } : undefined}
    >
      {!logoUrl ? (
        companyName.trim() ? (
          <span>{initialsFromName(companyName)}</span>
        ) : (
          <Building2 className="h-5 w-5 text-[#C9A646]" />
        )
      ) : null}
    </div>
  );
}
