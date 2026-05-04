"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { BrandLockup } from "@/components/layout/brand-lockup";
import { cn } from "@/lib/utils/cn";
import type { SiteContent } from "@/types/site-content";

export function PublicHeader({
  content,
}: {
  content: SiteContent["header"];
}) {
  const pathname = usePathname();
  const currentPath = pathname.replace(/\/$/, "") || "/";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0F172A]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center"
          aria-label="R-Task Management home"
          onClick={() => setIsMenuOpen(false)}
        >
          <BrandLockup
            hideTextOnSmall
            subtitle={content.brand.subtitle}
            title={content.brand.title}
          />
        </Link>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          {content.navLinks.map((link) => {
            const linkPath = link.href.replace(/\/$/, "") || "/";
            const isActive =
              linkPath === "/"
                ? currentPath === "/"
                : currentPath === linkPath || currentPath.startsWith(`${linkPath}/`);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                data-active={isActive ? "true" : undefined}
                className={cn(
                  "public-nav-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A646]/45",
                  isActive && "public-nav-link-active",
                )}
                href={link.href}
                key={link.href}
                onClick={() => setIsMenuOpen(false)}
              >
                <span>{link.label}</span>
                {isActive ? <span className="public-nav-link-indicator" aria-hidden="true" /> : null}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href={content.portalCta.href}
            className="public-portal-link hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A646]/45 md:inline-flex"
          >
            {content.portalCta.label}
          </Link>
          <button
            aria-controls="public-mobile-menu"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/12 bg-white/5 text-white transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A646]/45 md:hidden"
            onClick={() => setIsMenuOpen((current) => !current)}
            type="button"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <div
        className={cn(
          "border-t border-white/10 bg-[#0F172A]/98 md:hidden",
          isMenuOpen ? "block" : "hidden",
        )}
        id="public-mobile-menu"
      >
        <nav aria-label="Mobile navigation" className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
          {content.navLinks.map((link) => {
            const linkPath = link.href.replace(/\/$/, "") || "/";
            const isActive =
              linkPath === "/"
                ? currentPath === "/"
                : currentPath === linkPath || currentPath.startsWith(`${linkPath}/`);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-md px-4 py-3 text-sm font-semibold text-white/90 transition-colors duration-200 hover:bg-white/8 hover:text-white",
                  isActive && "bg-white/10 text-white",
                )}
                href={link.href}
                key={link.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            className="mt-2 inline-flex h-11 items-center justify-center rounded-md border border-[#C9A646] bg-[#C9A646] px-4 text-sm font-semibold text-[#111827] shadow-[0_12px_26px_rgba(201,166,70,0.22)] transition-all duration-200 hover:bg-[#B8933A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A646]/45"
            href={content.portalCta.href}
            onClick={() => setIsMenuOpen(false)}
          >
            {content.portalCta.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
