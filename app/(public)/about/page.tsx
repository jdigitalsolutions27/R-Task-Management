import Image from "next/image";
import { CheckCircle2, ShieldCheck } from "lucide-react";

import { getSiteContent } from "@/lib/db/site-content";

export default async function AboutPage() {
  const siteContent = await getSiteContent();

  return (
    <div className="landing-page">
      <section className="relative overflow-hidden bg-[#0F172A]">
        <Image
          src={siteContent.about.hero.image.url}
          alt={siteContent.about.hero.image.alt}
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-[#0F172A]/18" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/84 via-[#0F172A]/48 to-[#0F172A]/14" />

        <div className="landing-container relative flex min-h-[360px] items-center py-20 lg:py-24">
          <div className="max-w-4xl space-y-5">
            <p className="text-xs font-extrabold uppercase text-[#C9A646]">
              {siteContent.about.hero.kicker}
            </p>
            <h1 className="text-4xl font-bold leading-tight text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.38)] sm:text-5xl">
              {siteContent.about.hero.title}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-100 [text-shadow:0_1px_12px_rgba(0,0,0,0.35)]">
              {siteContent.about.hero.description}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#F8F6F2]">
        <div className="landing-container grid gap-12 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-24">
          <div className="landing-card landing-card-hover relative min-h-[380px] overflow-hidden shadow-[0_24px_60px_rgba(15,23,42,0.12)] sm:min-h-[500px]">
            <Image
              src={siteContent.about.image.url}
              alt={siteContent.about.image.alt}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/62 via-[#0F172A]/10 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-white/20 bg-white/94 p-5 shadow-lg backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="landing-icon shrink-0">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111827]">{siteContent.about.feature.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[#6B7280]">
                    {siteContent.about.feature.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-5 text-base leading-8 text-[#6B7280]">
              {siteContent.about.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {siteContent.about.strengths.map((item) => (
                <div
                  key={item}
                  className="landing-card landing-card-hover flex items-center gap-2 px-3 py-3 text-sm font-bold text-[#111827]"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#B8933A]" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>

            <section className="landing-card landing-card-hover p-8">
              <h2 className="text-xl font-bold text-[#111827]">{siteContent.about.note.title}</h2>
              <p className="mt-3 text-base leading-8 text-[#6B7280]">
                {siteContent.about.note.description}
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
