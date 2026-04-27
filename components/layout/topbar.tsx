import Link from "next/link";
import { Menu } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { BrandLockup } from "@/components/layout/brand-lockup";
import { NotificationBellLink } from "@/components/notifications/notification-bell-link";
import { Button } from "@/components/ui/button";
import { initialsFromName } from "@/lib/utils/format";

export function Topbar({
  avatarUrl,
  fullName,
  notificationCount,
  onMenuClick,
  userId,
}: {
  avatarUrl: string | null;
  fullName: string;
  notificationCount: number;
  onMenuClick: () => void;
  userId: string;
}) {
  return (
    <div
      className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.18)] backdrop-blur-[10px] sm:px-6 md:flex-row md:items-center md:justify-between"
      style={{ backgroundColor: "var(--tenant-primary, #0F172A)" }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3 lg:hidden">
          <Button
            aria-label="Open navigation menu"
            className="h-11 w-11 shrink-0 rounded-full border-white/10 bg-white/10 p-0 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-white/14"
            onClick={onMenuClick}
            type="button"
            variant="ghost"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <BrandLockup compact />
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <Link
            aria-label="Open profile"
            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#C9A646]/40 bg-[#C9A646] bg-cover bg-center text-sm font-bold text-[#111827] shadow-[0_10px_24px_rgba(201,166,70,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A646]"
            href="/profile"
            style={
              avatarUrl
                ? {
                    backgroundImage: `url(${avatarUrl})`,
                    borderColor: "color-mix(in srgb, var(--tenant-accent, #C9A646) 38%, transparent)",
                  }
                : {
                    backgroundColor: "var(--tenant-accent, #C9A646)",
                    borderColor: "color-mix(in srgb, var(--tenant-accent, #C9A646) 38%, transparent)",
                    color: "var(--tenant-accent-foreground, #111827)",
                  }
            }
          >
            {!avatarUrl ? initialsFromName(fullName) : null}
          </Link>
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight text-white sm:text-lg">{fullName}</h1>
            <Link
              className="mt-1 inline-block text-xs font-semibold text-[#C9A646] transition-colors hover:text-[#F1D26A]"
              href="/profile"
              style={{ color: "var(--tenant-accent, #C9A646)" }}
            >
              View profile
            </Link>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <NotificationBellLink initialCount={notificationCount} userId={userId} />
        <SignOutButton />
      </div>
    </div>
  );
}
