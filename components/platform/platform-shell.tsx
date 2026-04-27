"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { BrandLockup } from "@/components/layout/brand-lockup";
import { PlatformSidebar } from "@/components/platform/platform-sidebar";
import { Button } from "@/components/ui/button";
import { initialsFromName } from "@/lib/utils/format";

export function PlatformShell({
  avatarUrl,
  children,
  fullName,
}: {
  avatarUrl: string | null;
  children: ReactNode;
  fullName: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#111827]">
      <div className="hidden lg:block">
        <PlatformSidebar />
      </div>
      {isSidebarOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            aria-label="Close platform navigation menu"
            className="flex-1 bg-[#020617]/60 backdrop-blur-[2px]"
            onClick={() => setIsSidebarOpen(false)}
            type="button"
          />
          <div className="relative w-[19rem] max-w-[86vw]">
            <PlatformSidebar
              className="max-w-none shadow-[0_28px_70px_rgba(2,6,23,0.38)]"
              onNavigate={() => setIsSidebarOpen(false)}
            />
            <Button
              aria-label="Close platform navigation menu"
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
        <header className="flex flex-col gap-4 border-b border-white/10 bg-[#0F172A] px-5 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.18)] sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button
              aria-label="Open platform navigation menu"
              className="h-11 w-11 shrink-0 rounded-full border-white/10 bg-white/10 p-0 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-white/14 lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
              type="button"
              variant="ghost"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="lg:hidden">
              <BrandLockup compact />
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <Link
                aria-label="Open platform profile"
                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#C9A646]/40 bg-[#C9A646] bg-cover bg-center text-sm font-bold text-[#111827] shadow-[0_10px_24px_rgba(201,166,70,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A646]"
                href="/platform/profile"
                style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
              >
                {!avatarUrl ? initialsFromName(fullName) : null}
              </Link>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C9A646]">
                  Platform control
                </p>
                <h1 className="mt-1 text-base font-bold text-white sm:text-lg">{fullName}</h1>
                <Link className="mt-1 inline-block text-xs font-semibold text-[#C9A646] transition-colors hover:text-[#F1D26A]" href="/platform/profile">
                  Edit profile
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/10"
              href="/"
              target="_blank"
              rel="noreferrer"
            >
              View website
            </a>
            <SignOutButton redirectTo="/platform-login" />
          </div>
        </header>
        <main className="app-shell-main flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
