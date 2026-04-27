import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { BrandLockup } from "@/components/layout/brand-lockup";
import type { SiteContent } from "@/types/site-content";

const socialIconMap = {
  Facebook,
  Instagram,
  LinkedIn: Linkedin,
  WhatsApp: MessageCircle,
};

export function PublicFooter({
  content,
}: {
  content: SiteContent["footer"];
}) {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#0F172A]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage: `url('${content.backgroundImage.url}')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/95 to-[#0F172A]/88" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-12 text-sm text-slate-300 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div className="space-y-4">
          <BrandLockup compact />
          <p className="max-w-sm leading-6">{content.tagline}</p>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#C9A646]">
            Contact
          </h2>
          <div className="mt-4 space-y-3">
            <p className="flex items-start gap-3 leading-6">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A646]" />
              <span>{content.address}</span>
            </p>
            <a
              className="flex items-center gap-3 transition-colors hover:text-white"
              href={`mailto:${content.email}`}
            >
              <Mail className="h-4 w-4 text-[#C9A646]" />
              {content.email}
            </a>
            <a
              className="flex items-center gap-3 transition-colors hover:text-white"
              href={`tel:${content.phone.replace(/[^0-9+]/g, "")}`}
            >
              <Phone className="h-4 w-4 text-[#C9A646]" />
              {content.phone}
            </a>
            <p className="text-xs text-slate-400">{content.responseNote}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#C9A646]">
            Follow
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {[...content.socials, { label: "WhatsApp", url: `https://wa.me/${content.whatsApp.replace(/[^0-9]/g, "")}` }].map((item) => {
              const Icon =
                socialIconMap[item.label as keyof typeof socialIconMap] ?? Linkedin;

              return (
                <a
                  aria-label={item.label}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A646] hover:bg-[#C9A646] hover:text-[#111827]"
                  href={item.url}
                  key={item.label}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
          <nav className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
            <Link className="transition-colors hover:text-white" href="/about">
              About
            </Link>
            <Link className="transition-colors hover:text-white" href="/services">
              Services
            </Link>
            <Link className="transition-colors hover:text-white" href="/contact">
              Contact
            </Link>
          </nav>
        </div>
      </div>
      <div className="relative border-t border-white/10 bg-[#0F172A]/75 px-6 py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} R-Task Management Property Solution. All rights reserved.
      </div>
    </footer>
  );
}
