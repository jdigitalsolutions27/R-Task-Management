import Image from "next/image";
import Link from "next/link";
import { Clock3, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";

import { ContactForm } from "@/components/contact/contact-form";
import { getSiteContent } from "@/lib/db/site-content";

export default async function ContactPage() {
  const siteContent = await getSiteContent();
  const contactItems = [
    {
      description: siteContent.contact.details.address,
      href: null,
      icon: MapPin,
      label: "Address",
    },
    {
      description: siteContent.contact.details.email,
      href: `mailto:${siteContent.contact.details.email}`,
      icon: Mail,
      label: "Email",
    },
    {
      description: siteContent.contact.details.phone,
      href: `tel:${siteContent.contact.details.phone.replace(/[^0-9+]/g, "")}`,
      icon: Phone,
      label: "Phone",
    },
    {
      description: siteContent.contact.details.whatsApp,
      href: `https://wa.me/${siteContent.contact.details.whatsApp.replace(/[^0-9]/g, "")}`,
      icon: MessageCircle,
      label: "WhatsApp",
    },
    {
      description: siteContent.contact.details.responseTime,
      href: null,
      icon: Clock3,
      label: "Response time",
    },
  ] as const;

  return (
    <div className="landing-page">
      <section className="relative overflow-hidden bg-[#0F172A]">
        <Image
          src={siteContent.contact.hero.image.url}
          alt={siteContent.contact.hero.image.alt}
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
              {siteContent.contact.hero.kicker}
            </p>
            <h1 className="text-4xl font-bold leading-tight text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.38)] sm:text-5xl">
              {siteContent.contact.hero.title}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-100 [text-shadow:0_1px_12px_rgba(0,0,0,0.35)]">
              {siteContent.contact.hero.description}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#F8F6F2]">
        <div className="landing-container grid gap-10 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:py-24">
          <section className="space-y-8">
            <div className="space-y-5">
              <p className="landing-kicker">{siteContent.contact.request.kicker}</p>
              <h2 className="text-3xl font-bold leading-tight text-[#111827] sm:text-4xl">
                {siteContent.contact.request.title}
              </h2>
              <p className="max-w-2xl text-base leading-8 text-[#6B7280]">
                {siteContent.contact.request.description}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={siteContent.contact.request.primaryCta.href} className="landing-button-primary">
                {siteContent.contact.request.primaryCta.label}
              </Link>
              <Link href={siteContent.contact.request.secondaryCta.href} className="landing-button-secondary">
                {siteContent.contact.request.secondaryCta.label}
              </Link>
            </div>

            <div className="landing-card landing-card-hover grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
              {contactItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex min-w-0 gap-4 rounded-lg border border-[#E5E7EB] bg-[#FCFBF8] p-4"
                  >
                    <div className="landing-icon mt-0.5 shrink-0">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#111827]">{item.label}</h3>
                      {item.href ? (
                        <a
                          className="mt-1 block break-words text-sm font-semibold leading-6 text-[#B8933A] transition-colors hover:text-[#8a6d2a]"
                          href={item.href}
                          rel={item.label === "WhatsApp" ? "noreferrer" : undefined}
                          target={item.label === "WhatsApp" ? "_blank" : undefined}
                        >
                          {item.description}
                        </a>
                      ) : (
                        <p className="mt-1 break-words text-sm leading-6 text-[#6B7280]">{item.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="landing-card landing-card-hover flex items-start gap-3 px-4 py-4 text-sm leading-6 text-[#6B7280]">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#B8933A]" aria-hidden="true" />
              {siteContent.contact.details.supportNote}
            </div>
          </section>

          <section className="landing-card p-6 shadow-[0_24px_60px_rgba(15,23,42,0.1)] sm:p-8">
            <div className="mb-7">
              <p className="landing-kicker">Send a message</p>
              <h2 className="mt-3 text-2xl font-bold text-[#111827]">Tell us about your team</h2>
              <p className="mt-2 text-sm leading-7 text-[#6B7280]">
                Share a few details and we&apos;ll help you take the next step.
              </p>
            </div>
            <ContactForm
              privacyNote={siteContent.contact.details.privacyNote}
            />
          </section>
        </div>
      </section>
    </div>
  );
}
