import Image from "next/image";
import {
  ClipboardCheck,
  Cloud,
  Database,
  FileCheck2,
  FolderArchive,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { getSiteContent } from "@/lib/db/site-content";

const serviceIcons = [FileCheck2, ClipboardCheck, ShieldCheck, FolderArchive];
const trustIcons = [Database, UserCheck, ClipboardCheck, Cloud];

export default async function ServicesPage() {
  const siteContent = await getSiteContent();
  const services = siteContent.services.services.map((service, index) => ({
    ...service,
    icon: serviceIcons[index] ?? FileCheck2,
  }));
  const trustPoints = siteContent.services.trust.points.map((point, index) => ({
    ...point,
    icon: trustIcons[index] ?? ShieldCheck,
  }));

  return (
    <div className="landing-page">
      <section className="relative overflow-hidden bg-[#0F172A]">
        <Image
          src={siteContent.services.hero.image.url}
          alt={siteContent.services.hero.image.alt}
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-[#0F172A]/18" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/84 via-[#0F172A]/48 to-[#0F172A]/14" />

        <div className="landing-container relative flex min-h-[360px] items-center py-20 lg:py-24">
          <div className="max-w-3xl space-y-5">
            <p className="text-xs font-extrabold uppercase text-[#C9A646]">
              {siteContent.services.hero.kicker}
            </p>
            <h1 className="text-4xl font-bold leading-tight text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.38)] sm:text-5xl">
              {siteContent.services.hero.title}
            </h1>
            <p className="text-base leading-8 text-slate-100 [text-shadow:0_1px_12px_rgba(0,0,0,0.35)]">
              {siteContent.services.hero.description}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="landing-container py-20 lg:py-24">
          <div className="grid gap-6 md:grid-cols-2">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <section
                  key={service.title}
                  className="landing-card landing-card-hover flex h-full flex-col p-8"
                >
                  <div className="landing-icon h-12 w-12">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="mt-6 text-xl font-bold text-[#111827]">{service.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[#6B7280]">{service.description}</p>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[#E5E7EB] bg-[#F1EFEA]">
        <div className="landing-container py-20 lg:py-24">
          <div className="max-w-3xl space-y-5">
            <p className="landing-kicker">{siteContent.services.trust.kicker}</p>
            <h2 className="text-3xl font-bold leading-tight text-[#111827] sm:text-4xl">
              {siteContent.services.trust.title}
            </h2>
            <p className="text-base leading-8 text-[#6B7280]">
              {siteContent.services.trust.description}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {trustPoints.map((point) => {
              const Icon = point.icon;

              return (
                <section
                  key={point.title}
                  className="landing-card landing-card-hover flex h-full flex-col p-8"
                >
                  <div className="landing-icon h-12 w-12">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-[#111827]">{point.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#6B7280]">{point.description}</p>
                </section>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
