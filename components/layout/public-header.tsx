"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLockup } from "@/components/layout/brand-lockup";
import { cn } from "@/lib/utils/cn";
import type { SiteContent } from "@/types/site-content";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader({
  content,
}: {
  content: SiteContent["header"];
}) {
  const pathname = usePathname();
  const currentPath = pathname.replace(/\/$/, "") || "/";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0F172A]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
        <Link
          href="/"
          className="flex items-center"
          aria-label="R-Task Management home"
        >
          <BrandLockup hideTextOnSmall />
        </Link>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          {links.map((link) => {
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
              >
                <span>{link.label}</span>
                {isActive ? <span className="public-nav-link-indicator" aria-hidden="true" /> : null}
              </Link>
            );
          })}
        </nav>
        <Link
          href={content.portalCta.href}
          className="public-portal-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A646]/45"
        >
          {content.portalCta.label}
        </Link>
      </div>
    </header>
  );
}
