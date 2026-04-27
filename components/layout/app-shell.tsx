"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { getReadableTextColor, mixHexColors, normalizeHexColor } from "@/lib/utils/color";
import type { AppRole } from "@/types/app";

export function AppShell({
  avatarUrl,
  children,
  companyBackgroundColor,
  companyLogoUrl,
  companyName,
  companyPrimaryColor,
  companySecondaryColor,
  fullName,
  notificationCount,
  role,
  userId,
}: {
  avatarUrl: string | null;
  children: ReactNode;
  companyBackgroundColor: string | null;
  companyLogoUrl: string | null;
  companyName: string | null;
  companyPrimaryColor: string | null;
  companySecondaryColor: string | null;
  fullName: string;
  notificationCount: number;
  role: AppRole;
  userId: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const primaryColor = normalizeHexColor(companyPrimaryColor, "#0F172A");
  const accentColor = normalizeHexColor(companySecondaryColor, "#C9A646");
  const backgroundColor = normalizeHexColor(companyBackgroundColor, "#F8FAFC");
  const accentHover = mixHexColors(accentColor, "#000000", 0.1);
  const accentSoft = mixHexColors(accentColor, "#FFFFFF", 0.86);
  const primarySoft = mixHexColors(primaryColor, "#FFFFFF", 0.88);
  const shellStyle = {
    "--tenant-accent": accentColor,
    "--tenant-accent-foreground": getReadableTextColor(accentColor),
    "--tenant-accent-hover": accentHover,
    "--tenant-accent-soft": accentSoft,
    "--tenant-background": backgroundColor,
    "--tenant-primary": primaryColor,
    "--tenant-primary-foreground": getReadableTextColor(primaryColor),
    "--tenant-primary-soft": primarySoft,
  } as CSSProperties;

  return (
    <div className="tenant-theme flex min-h-screen bg-[#F8FAFC] text-[#111827]" style={shellStyle}>
      <div className="hidden lg:block">
        <Sidebar
          companyLogoUrl={companyLogoUrl}
          companyName={companyName}
          companyPrimaryColor={primaryColor}
          companySecondaryColor={accentColor}
          role={role}
        />
      </div>
      {isSidebarOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            aria-label="Close navigation menu"
            className="flex-1 bg-[#020617]/60 backdrop-blur-[2px]"
            onClick={() => setIsSidebarOpen(false)}
            type="button"
          />
          <div className="relative w-[19rem] max-w-[86vw]">
            <Sidebar
              className="max-w-none shadow-[0_28px_70px_rgba(2,6,23,0.38)]"
              companyLogoUrl={companyLogoUrl}
              companyName={companyName}
              companyPrimaryColor={primaryColor}
              companySecondaryColor={accentColor}
              onNavigate={() => setIsSidebarOpen(false)}
              role={role}
            />
            <Button
              aria-label="Close navigation menu"
              className="absolute right-3 top-3 h-9 w-9 rounded-full border-white/10 bg-white/10 p-0 text-white hover:bg-white/16"
              onClick={() => setIsSidebarOpen(false)}
              type="button"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          avatarUrl={avatarUrl}
          fullName={fullName}
          notificationCount={notificationCount}
          onMenuClick={() => setIsSidebarOpen(true)}
          userId={userId}
        />
        <main className="app-shell-main flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
