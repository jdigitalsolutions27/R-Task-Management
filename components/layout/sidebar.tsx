"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardList,
  FileArchive,
  FileCheck2,
  Gauge,
  LifeBuoy,
  ScrollText,
  Settings,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import type { HTMLAttributes } from "react";

import { CompanyLogoMark } from "@/components/company/company-logo-mark";
import { BrandLockup } from "@/components/layout/brand-lockup";
import { hasCapability } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils/cn";
import type { AppRole } from "@/types/app";

const iconMap = {
  "/approvals": FileCheck2,
  "/dashboard": Gauge,
  "/evictions": FileArchive,
  "/files": Building2,
  "/inspections": ClipboardList,
  "/history": ScrollText,
  "/profile": UserRound,
  "/settings": Settings,
  "/shopping-reports": ShoppingBag,
  "/support": LifeBuoy,
};

const navigationSections = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", capability: "dashboard:view" },
      { href: "/files", label: "Files", capability: "files:view" },
      { href: "/approvals", label: "Approvals", capability: "files:approve" },
    ],
    label: "Main",
  },
  {
    items: [
      { href: "/inspections", label: "Inspections", capability: "inspections:view" },
      { href: "/shopping-reports", label: "Reports", capability: "reports:view" },
      { href: "/evictions", label: "Evictions", capability: "evictions:view" },
    ],
    label: "Operations",
  },
  {
    items: [
      { href: "/support", label: "Help & Support", capability: "support:view" },
      { href: "/profile", label: "Profile", capability: "profile:view" },
      { href: "/history", label: "History", capability: "history:view" },
      { href: "/settings", label: "Settings", capability: "settings:view" },
    ],
    label: "System",
  },
] as const;

export function Sidebar({
  className,
  companyLogoUrl,
  companyName,
  companyPrimaryColor,
  companySecondaryColor,
  onNavigate,
  role,
  ...props
}: {
  className?: string;
  companyLogoUrl?: string | null;
  companyName?: string | null;
  companyPrimaryColor?: string | null;
  companySecondaryColor?: string | null;
  onNavigate?: () => void;
  role: AppRole;
} & HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-full max-w-72 flex-col border-r border-white/10 bg-[#0F172A] shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)]",
        className,
      )}
      style={{
        backgroundColor: companyPrimaryColor ?? "#0F172A",
      }}
      {...props}
    >
      <div className="border-b border-[#2a2d35] px-5 py-6">
        <BrandLockup compact />
        {companyName ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <CompanyLogoMark
              className="border-white/10 bg-white/10 text-white shadow-none"
              companyName={companyName}
              logoUrl={companyLogoUrl}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-500">
                Company Workspace
              </p>
              <p className="truncate text-sm font-semibold text-white">{companyName}</p>
            </div>
          </div>
        ) : null}
        <p className="mt-4 inline-flex max-w-full rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          {role.replace("_", " ")}
        </p>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navigationSections.map((section) => {
          const visibleItems = section.items.filter((item) =>
            hasCapability(role, item.capability),
          );

          if (!visibleItems.length) {
            return null;
          }

          return (
            <div className="space-y-2" key={section.label}>
              <p className="px-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                {section.label}
              </p>
              {visibleItems.map((item) => {
                const Icon = iconMap[item.href as keyof typeof iconMap] ?? Gauge;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                      active
                        ? "text-[#111827]"
                        : "text-slate-300 hover:bg-white/8 hover:text-white",
                    )}
                    style={
                      active
                        ? {
                            backgroundColor: companySecondaryColor ?? "var(--tenant-accent, #C9A646)",
                            boxShadow: "0 14px 30px rgba(15,23,42,0.22), inset 0 1px 0 rgba(255,255,255,0.12)",
                            color: "var(--tenant-accent-foreground, #111827)",
                          }
                        : undefined
                    }
                  >
                    {active ? (
                      <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-[rgba(15,23,42,0.28)]" />
                    ) : null}
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        active ? "text-[#111827]" : "",
                      )}
                      style={!active ? { color: companySecondaryColor ?? "var(--tenant-accent, #C9A646)" } : undefined}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
