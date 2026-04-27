"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, LifeBuoy, MonitorCog, UserRound, UsersRound } from "lucide-react";

import { BrandLockup } from "@/components/layout/brand-lockup";
import { cn } from "@/lib/utils/cn";

const navigation = [
  { href: "/platform", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/platform/companies", icon: Building2, label: "Client Companies" },
  { href: "/platform/people", icon: UsersRound, label: "Users & Access" },
  { href: "/platform/support", icon: LifeBuoy, label: "Help & Support" },
  { href: "/platform/content", icon: MonitorCog, label: "Website Content" },
  { href: "/platform/profile", icon: UserRound, label: "Profile" },
] as const;

export function PlatformSidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const activeHref =
    [...navigation]
      .sort((left, right) => right.href.length - left.href.length)
      .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href ??
    "/platform";

  return (
    <aside
      className={cn(
        "flex h-full w-full max-w-72 flex-col border-r border-white/10 bg-[#0F172A]",
        className,
      )}
    >
      <div className="border-b border-[#2a2d35] px-5 py-6">
        <BrandLockup compact />
        <p className="mt-4 rounded-md border border-[#2a2d35] bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#C9A646]">
          Platform Controller
        </p>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-5">
        {navigation.map((item) => {
          const active = activeHref === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                active
                  ? "bg-[#C9A646] text-[#111827] shadow-[0_12px_28px_rgba(201,166,70,0.2)]"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active ? "text-[#111827]" : "text-[#C9A646]",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
