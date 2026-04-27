import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  ClipboardCheck,
  FileCheck2,
  FolderCheck,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

import { getSiteContent } from "@/lib/db/site-content";

const workflowIcons = [UploadCloud, ClipboardCheck, FolderCheck];
const coverageIcons = [ShieldCheck, FileCheck2];

export default async function HomePage() {
  const siteContent = await getSiteContent();
  const workflowSteps = siteContent.home.workflow.steps.map((step, index) => ({
    ...step,
    icon: workflowIcons[index] ?? UploadCloud,
  }));
  const coverageHighlights = siteContent.home.coverage.highlights.map((item, index) => ({
    ...item,
    icon: coverageIcons[index] ?? ShieldCheck,
  }));

  return (
    <div className="landing-page">
      <section className="relative overflow-hidden border-b border-[#E5E7EB] bg-[#0F172A]">
        <Image
          src={siteContent.home.hero.image.url}
          alt={siteContent.home.hero.image.alt}
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-[#0F172A]/18" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/84 via-[#0F172A]/46 to-[#0F172A]/8" />

        <div className="landing-container relative flex min-h-[640px] items-center py-20 lg:py-24">
          <div className="max-w-4xl space-y-7">
            <p className="text-xs font-extrabold uppercase text-[#C9A646]">
              {siteContent.home.hero.kicker}
            </p>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.38)] sm:text-5xl lg:text-6xl">
                {siteContent.home.hero.title}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-100 [text-shadow:0_1px_12px_rgba(0,0,0,0.35)] sm:text-lg">
                {siteContent.home.hero.description}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={siteContent.home.hero.primaryCta.href} className="landing-button-primary">
                {siteContent.home.hero.primaryCta.label}
              </Link>
              <Link href={siteContent.home.hero.secondaryCta.href} className="landing-button-secondary">
                {siteContent.home.hero.secondaryCta.label}
              </Link>
            </div>

            <p className="text-sm font-semibold text-slate-100 [text-shadow:0_1px_10px_rgba(0,0,0,0.35)]">
              {siteContent.home.hero.trustLine}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="landing-container py-20 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="landing-kicker">{siteContent.home.workflow.kicker}</p>
            <h2 className="mt-3 text-3xl font-bold text-[#111827] sm:text-4xl">{siteContent.home.workflow.title}</h2>
            <p className="mt-4 text-base leading-7 text-[#6B7280]">
              {siteContent.home.workflow.description}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="landing-card landing-card-hover flex h-full flex-col p-8"
                >
                  <div className="landing-icon h-12 w-12">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="mt-6 text-xs font-extrabold uppercase text-[#B8933A]">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-[#111827]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#6B7280]">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#F8F6F2]">
        <div className="landing-container grid gap-10 border-t border-[#E5E7EB] py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div className="space-y-6">
            <p className="landing-kicker">{siteContent.home.coverage.kicker}</p>
            <h2 className="max-w-3xl text-3xl font-bold leading-tight text-[#111827] sm:text-4xl">
              {siteContent.home.coverage.title}
            </h2>
            <p className="max-w-2xl text-base leading-8 text-[#6B7280]">
              {siteContent.home.coverage.description}
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              {coverageHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div className="landing-card landing-card-hover p-6" key={item.title}>
                    <div className="landing-icon">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-[#111827]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#6B7280]">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="landing-card landing-card-hover relative min-h-[380px] overflow-hidden">
            <Image
              src={siteContent.home.coverage.image.url}
              alt={siteContent.home.coverage.image.alt}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover object-center"
            />
            <div className="absolute left-5 top-5 flex items-center gap-3 rounded-lg border border-white/20 bg-white/92 px-4 py-3 text-sm font-bold text-[#111827] shadow-sm backdrop-blur">
              <Building2 className="h-5 w-5 text-[#B8933A]" aria-hidden="true" />
              {siteContent.home.coverage.imageLabel}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
