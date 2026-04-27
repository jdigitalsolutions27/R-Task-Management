"use client";

import type { LucideIcon } from "lucide-react";
import {
  Globe,
  ImageUp,
  LayoutTemplate,
  MonitorCog,
  PhoneCall,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { defaultSiteContent } from "@/lib/site-content/defaults";
import type {
  SiteContent,
  SiteFeatureItem,
  SiteImageContent,
  SiteSocialLink,
} from "@/types/site-content";

type ContentSectionKey = "header" | "home" | "about" | "services" | "contact" | "footer";

const contentSections: Array<{
  description: string;
  href?: string;
  icon: LucideIcon;
  key: ContentSectionKey;
  kicker: string;
  title: string;
}> = [
  {
    description: "Update the main portal button shown in the top navigation.",
    href: "/",
    icon: LayoutTemplate,
    key: "header",
    kicker: "Header",
    title: "Navigation and portal button",
  },
  {
    description: "Control the hero area, workflow steps, and home page coverage section.",
    href: "/",
    icon: Globe,
    key: "home",
    kicker: "Home",
    title: "Home page content",
  },
  {
    description: "Edit the About page story, strengths, team note, and supporting images.",
    href: "/about",
    icon: ShieldCheck,
    key: "about",
    kicker: "About",
    title: "About page content",
  },
  {
    description: "Manage services, trust points, and the public services page layout content.",
    href: "/services",
    icon: MonitorCog,
    key: "services",
    kicker: "Services",
    title: "Services and trust sections",
  },
  {
    description: "Update contact messaging, support details, and call-to-action links.",
    href: "/contact",
    icon: PhoneCall,
    key: "contact",
    kicker: "Contact",
    title: "Contact page content",
  },
  {
    description: "Edit footer contact details, social links, and the footer background image.",
    href: "/",
    icon: LayoutTemplate,
    key: "footer",
    kicker: "Footer",
    title: "Footer information",
  },
];

function SectionIntro({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B8933A]">{kicker}</p>
      <h3 className="mt-1 text-xl font-bold text-[#111827]">{title}</h3>
    </div>
  );
}

function ImageField({
  folder,
  image,
  label,
  onChange,
  onUpload,
  uploading,
}: {
  folder: string;
  image: SiteImageContent;
  label: string;
  onChange: (next: SiteImageContent) => void;
  onUpload: (folder: string, file: File) => Promise<void>;
  uploading: boolean;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#111827]">{label}</p>
          <p className="mt-1 text-xs text-slate-500">Recommended for landscape use on the website.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#0F172A]/65 bg-white px-3 py-2 text-xs font-semibold text-[#111827] transition-all duration-200 hover:border-[#C9A646] hover:bg-[#fdf9ed]">
          <ImageUp className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload image"}
          <input
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                void onUpload(folder, file);
                event.target.value = "";
              }
            }}
            type="file"
          />
        </label>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Image URL</label>
          <Input onChange={(event) => onChange({ ...image, url: event.target.value })} value={image.url} />
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Alt text</label>
          <Input onChange={(event) => onChange({ ...image, alt: event.target.value })} value={image.alt} />
        </div>
        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
          {image.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={image.alt} className="h-full min-h-44 w-full object-cover" src={image.url} />
          ) : (
            <div className="flex min-h-44 items-center justify-center text-sm text-slate-400">No image selected</div>
          )}
        </div>
      </div>
    </div>
  );
}

function TextListEditor({ items, label, onChange }: { items: string[]; label: string; onChange: (next: string[]) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-[#111827]">{label}</label>
        <Button onClick={() => onChange([...items, ""])} size="sm" type="button" variant="outline">
          <Plus className="h-4 w-4" />
          Add item
        </Button>
      </div>
      {items.map((item, index) => (
        <div className="flex gap-3" key={`${label}-${index}`}>
          <Input
            onChange={(event) =>
              onChange(items.map((current, currentIndex) => (currentIndex === index ? event.target.value : current)))
            }
            value={item}
          />
          <Button
            onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))}
            size="sm"
            type="button"
            variant="outline"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function FeatureListEditor({ items, label, onChange }: { items: SiteFeatureItem[]; label: string; onChange: (next: SiteFeatureItem[]) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-[#111827]">{label}</label>
        <Button onClick={() => onChange([...items, { description: "", title: "" }])} size="sm" type="button" variant="outline">
          <Plus className="h-4 w-4" />
          Add item
        </Button>
      </div>
      {items.map((item, index) => (
        <div className="grid gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 lg:grid-cols-[0.8fr_1.2fr_auto]" key={`${label}-${index}`}>
          <Input
            onChange={(event) =>
              onChange(
                items.map((current, currentIndex) =>
                  currentIndex === index ? { ...current, title: event.target.value } : current,
                ),
              )
            }
            placeholder="Title"
            value={item.title}
          />
          <Textarea
            className="min-h-24"
            onChange={(event) =>
              onChange(
                items.map((current, currentIndex) =>
                  currentIndex === index ? { ...current, description: event.target.value } : current,
                ),
              )
            }
            placeholder="Description"
            value={item.description}
          />
          <div className="flex items-start justify-end">
            <Button
              onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))}
              size="sm"
              type="button"
              variant="outline"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SocialLinksEditor({ items, onChange }: { items: SiteSocialLink[]; onChange: (next: SiteSocialLink[]) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-[#111827]">Social links</label>
        <Button onClick={() => onChange([...items, { label: "", url: "" }])} size="sm" type="button" variant="outline">
          <Plus className="h-4 w-4" />
          Add link
        </Button>
      </div>
      {items.map((item, index) => (
        <div className="grid gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 lg:grid-cols-[0.7fr_1.3fr_auto]" key={`social-${index}`}>
          <Input
            onChange={(event) =>
              onChange(
                items.map((current, currentIndex) =>
                  currentIndex === index ? { ...current, label: event.target.value } : current,
                ),
              )
            }
            placeholder="Label"
            value={item.label}
          />
          <Input
            onChange={(event) =>
              onChange(
                items.map((current, currentIndex) =>
                  currentIndex === index ? { ...current, url: event.target.value } : current,
                ),
              )
            }
            placeholder="https://..."
            value={item.url}
          />
          <div className="flex items-start justify-end">
            <Button
              onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))}
              size="sm"
              type="button"
              variant="outline"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SiteContentManager({ initialContent }: { initialContent: SiteContent }) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<ContentSectionKey>("home");
  const [draft, setDraft] = useState(initialContent);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const activeSectionMeta = useMemo(
    () => contentSections.find((section) => section.key === activeSection) ?? contentSections[0],
    [activeSection],
  );

  function updateDraft(updater: (next: SiteContent) => void) {
    setDraft((current) => {
      const next = structuredClone(current);
      updater(next);
      return next;
    });
  }

  async function uploadAsset(folder: string, file: File, onComplete: (url: string) => void) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setUploadingField(folder);
    try {
      const formData = new FormData();
      formData.append("asset", file);
      formData.append("folder", folder);
      const response = await fetch("/api/settings/site-content/assets", { body: formData, method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to upload site image.");
      onComplete(payload.publicUrl);
      setSuccessMessage("Image uploaded.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to upload site image.");
    } finally {
      setUploadingField(null);
    }
  }

  async function saveContent() {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings/site-content", {
        body: JSON.stringify(draft),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save website content.");
      setSuccessMessage("Website content saved.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save website content.");
    } finally {
      setIsSaving(false);
    }
  }

  async function resetContent() {
    if (!window.confirm("Reset all website content back to defaults?")) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsResetting(true);
    try {
      const response = await fetch("/api/settings/site-content", { method: "DELETE" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Unable to reset website content.");
      setDraft(structuredClone(defaultSiteContent));
      setSuccessMessage("Website content reset to defaults.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to reset website content.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B8933A]">Guided editor</p>
            <h2 className="text-2xl font-bold text-[#111827]">Manage the website without touching code</h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Pick a section, make your text or image changes, preview the live page if needed, and click save when you are ready to publish.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button disabled={isSaving} onClick={saveContent} type="button">
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
            <Button disabled={isResetting} onClick={resetContent} type="button" variant="outline">
              <RotateCcw className="h-4 w-4" />
              {isResetting ? "Resetting..." : "Reset to defaults"}
            </Button>
          </div>
        </div>

        {errorMessage ? <p className="app-status-banner app-status-banner-error mt-4">{errorMessage}</p> : null}
        {successMessage ? <p className="app-status-banner app-status-banner-success mt-4">{successMessage}</p> : null}
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <SectionIntro kicker="Website sections" title="Choose what you want to edit" />
          <CardDescription>
            This keeps the editor simple for non-technical updates. Open one section at a time, make changes, then preview and save.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {contentSections.map((section) => {
                const Icon = section.icon;
                const isActive = section.key === activeSection;

                return (
                  <button
                    className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                      isActive
                        ? "border-[#C9A646] bg-[#fdf9ed] shadow-[0_18px_38px_-26px_rgba(201,166,70,0.45)]"
                        : "border-[#E2E8F0] bg-white hover:-translate-y-0.5 hover:border-[#C9A646]/50 hover:shadow-[0_18px_38px_-30px_rgba(15,23,42,0.2)]"
                    }`}
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={`rounded-xl border p-3 ${isActive ? "border-[#C9A646]/35 bg-[#C9A646]/15 text-[#B8933A]" : "border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A]"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-[0.14em] ${isActive ? "text-[#B8933A]" : "text-slate-400"}`}>
                        {section.kicker}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-bold text-[#111827]">{section.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{section.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B8933A]">Current section</p>
                <h3 className="mt-2 text-lg font-bold text-[#111827]">{activeSectionMeta.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{activeSectionMeta.description}</p>
              </div>
              {activeSectionMeta.href ? (
                <a
                  className="inline-flex h-10 items-center justify-center rounded-md border border-[#CBD5E1] bg-white px-4 text-sm font-semibold text-[#111827] shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A646] hover:bg-[#fdf9ed]"
                  href={activeSectionMeta.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  Preview this page
                </a>
              ) : null}
              <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
                <p className="font-semibold text-[#111827]">Helpful reminder</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Changes stay in the editor until you click <span className="font-semibold text-[#111827]">Save changes</span>. Use preview any time to double-check the page before sharing it.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {contentSections.map((section) => (
              <Button
                className={section.key === activeSection ? "pointer-events-none" : ""}
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                type="button"
                variant={section.key === activeSection ? "default" : "outline"}
              >
                {section.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {activeSection === "header" ? (
        <Card>
          <CardHeader>
            <SectionIntro kicker="Header" title="Top navigation call to action" />
            <CardDescription>Edit the main portal button shown in the website header.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <Input
              onChange={(event) => updateDraft((next) => { next.header.portalCta.label = event.target.value; })}
              placeholder="Header portal button label"
              value={draft.header.portalCta.label}
            />
            <Input
              onChange={(event) => updateDraft((next) => { next.header.portalCta.href = event.target.value; })}
              placeholder="Header portal button link"
              value={draft.header.portalCta.href}
            />
          </CardContent>
        </Card>
      ) : null}

      {activeSection === "home" ? (
        <Card>
          <CardHeader>
            <SectionIntro kicker="Home" title="Landing page content" />
            <CardDescription>Update the homepage section by section so the public site stays polished and consistent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-[#111827]">Hero section</h4>
              <Input value={draft.home.hero.kicker} onChange={(event) => updateDraft((next) => { next.home.hero.kicker = event.target.value; })} placeholder="Hero kicker" />
              <Input value={draft.home.hero.title} onChange={(event) => updateDraft((next) => { next.home.hero.title = event.target.value; })} placeholder="Hero title" />
              <Textarea className="min-h-28" value={draft.home.hero.description} onChange={(event) => updateDraft((next) => { next.home.hero.description = event.target.value; })} placeholder="Hero description" />
              <div className="grid gap-4 lg:grid-cols-2">
                <Input value={draft.home.hero.primaryCta.label} onChange={(event) => updateDraft((next) => { next.home.hero.primaryCta.label = event.target.value; })} placeholder="Primary button label" />
                <Input value={draft.home.hero.primaryCta.href} onChange={(event) => updateDraft((next) => { next.home.hero.primaryCta.href = event.target.value; })} placeholder="Primary button link" />
                <Input value={draft.home.hero.secondaryCta.label} onChange={(event) => updateDraft((next) => { next.home.hero.secondaryCta.label = event.target.value; })} placeholder="Secondary button label" />
                <Input value={draft.home.hero.secondaryCta.href} onChange={(event) => updateDraft((next) => { next.home.hero.secondaryCta.href = event.target.value; })} placeholder="Secondary button link" />
              </div>
              <Input value={draft.home.hero.trustLine} onChange={(event) => updateDraft((next) => { next.home.hero.trustLine = event.target.value; })} placeholder="Trust line" />
              <ImageField
                folder="home/hero"
                image={draft.home.hero.image}
                label="Home hero image"
                onChange={(image) => updateDraft((next) => { next.home.hero.image = image; })}
                onUpload={(folder, file) => uploadAsset(folder, file, (url) => updateDraft((next) => { next.home.hero.image.url = url; }))}
                uploading={uploadingField === "home/hero"}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-bold text-[#111827]">How it works section</h4>
              <Input value={draft.home.workflow.kicker} onChange={(event) => updateDraft((next) => { next.home.workflow.kicker = event.target.value; })} placeholder="Section kicker" />
              <Input value={draft.home.workflow.title} onChange={(event) => updateDraft((next) => { next.home.workflow.title = event.target.value; })} placeholder="Section title" />
              <Textarea className="min-h-24" value={draft.home.workflow.description} onChange={(event) => updateDraft((next) => { next.home.workflow.description = event.target.value; })} placeholder="Section description" />
              <FeatureListEditor items={draft.home.workflow.steps} label="Workflow steps" onChange={(items) => updateDraft((next) => { next.home.workflow.steps = items; })} />
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-bold text-[#111827]">Coverage section</h4>
              <Input value={draft.home.coverage.kicker} onChange={(event) => updateDraft((next) => { next.home.coverage.kicker = event.target.value; })} placeholder="Section kicker" />
              <Input value={draft.home.coverage.title} onChange={(event) => updateDraft((next) => { next.home.coverage.title = event.target.value; })} placeholder="Section title" />
              <Textarea className="min-h-24" value={draft.home.coverage.description} onChange={(event) => updateDraft((next) => { next.home.coverage.description = event.target.value; })} placeholder="Section description" />
              <Input value={draft.home.coverage.imageLabel} onChange={(event) => updateDraft((next) => { next.home.coverage.imageLabel = event.target.value; })} placeholder="Image label" />
              <FeatureListEditor items={draft.home.coverage.highlights} label="Coverage highlights" onChange={(items) => updateDraft((next) => { next.home.coverage.highlights = items; })} />
              <ImageField
                folder="home/coverage"
                image={draft.home.coverage.image}
                label="Coverage image"
                onChange={(image) => updateDraft((next) => { next.home.coverage.image = image; })}
                onUpload={(folder, file) => uploadAsset(folder, file, (url) => updateDraft((next) => { next.home.coverage.image.url = url; }))}
                uploading={uploadingField === "home/coverage"}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeSection === "about" ? (
        <Card>
          <CardHeader>
            <SectionIntro kicker="About" title="About page content" />
            <CardDescription>Edit the company story, supporting details, and imagery shown on the public About page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-[#111827]">Hero section</h4>
              <Input value={draft.about.hero.kicker} onChange={(event) => updateDraft((next) => { next.about.hero.kicker = event.target.value; })} placeholder="Hero kicker" />
              <Input value={draft.about.hero.title} onChange={(event) => updateDraft((next) => { next.about.hero.title = event.target.value; })} placeholder="Hero title" />
              <Textarea className="min-h-24" value={draft.about.hero.description} onChange={(event) => updateDraft((next) => { next.about.hero.description = event.target.value; })} placeholder="Hero description" />
              <ImageField
                folder="about/hero"
                image={draft.about.hero.image}
                label="About hero image"
                onChange={(image) => updateDraft((next) => { next.about.hero.image = image; })}
                onUpload={(folder, file) => uploadAsset(folder, file, (url) => updateDraft((next) => { next.about.hero.image.url = url; }))}
                uploading={uploadingField === "about/hero"}
              />
              <ImageField
                folder="about/feature"
                image={draft.about.image}
                label="About feature image"
                onChange={(image) => updateDraft((next) => { next.about.image = image; })}
                onUpload={(folder, file) => uploadAsset(folder, file, (url) => updateDraft((next) => { next.about.image.url = url; }))}
                uploading={uploadingField === "about/feature"}
              />
            </div>

            <TextListEditor items={draft.about.paragraphs} label="About paragraphs" onChange={(items) => updateDraft((next) => { next.about.paragraphs = items; })} />
            <TextListEditor items={draft.about.strengths} label="About strengths" onChange={(items) => updateDraft((next) => { next.about.strengths = items; })} />

            <div className="grid gap-4 lg:grid-cols-2">
              <Input value={draft.about.feature.title} onChange={(event) => updateDraft((next) => { next.about.feature.title = event.target.value; })} placeholder="Feature title" />
              <Textarea className="min-h-24" value={draft.about.feature.description} onChange={(event) => updateDraft((next) => { next.about.feature.description = event.target.value; })} placeholder="Feature description" />
              <Input value={draft.about.note.title} onChange={(event) => updateDraft((next) => { next.about.note.title = event.target.value; })} placeholder="Team note title" />
              <Textarea className="min-h-24" value={draft.about.note.description} onChange={(event) => updateDraft((next) => { next.about.note.description = event.target.value; })} placeholder="Team note description" />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeSection === "services" ? (
        <Card>
          <CardHeader>
            <SectionIntro kicker="Services" title="Services and trust sections" />
            <CardDescription>Manage the service cards, trust points, and page hero for the public services page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-[#111827]">Hero section</h4>
              <Input value={draft.services.hero.kicker} onChange={(event) => updateDraft((next) => { next.services.hero.kicker = event.target.value; })} placeholder="Hero kicker" />
              <Input value={draft.services.hero.title} onChange={(event) => updateDraft((next) => { next.services.hero.title = event.target.value; })} placeholder="Hero title" />
              <Textarea className="min-h-24" value={draft.services.hero.description} onChange={(event) => updateDraft((next) => { next.services.hero.description = event.target.value; })} placeholder="Hero description" />
              <ImageField
                folder="services/hero"
                image={draft.services.hero.image}
                label="Services hero image"
                onChange={(image) => updateDraft((next) => { next.services.hero.image = image; })}
                onUpload={(folder, file) => uploadAsset(folder, file, (url) => updateDraft((next) => { next.services.hero.image.url = url; }))}
                uploading={uploadingField === "services/hero"}
              />
            </div>

            <FeatureListEditor items={draft.services.services} label="Service cards" onChange={(items) => updateDraft((next) => { next.services.services = items; })} />

            <div className="space-y-4">
              <h4 className="text-lg font-bold text-[#111827]">Trust section</h4>
              <Input value={draft.services.trust.kicker} onChange={(event) => updateDraft((next) => { next.services.trust.kicker = event.target.value; })} placeholder="Trust kicker" />
              <Input value={draft.services.trust.title} onChange={(event) => updateDraft((next) => { next.services.trust.title = event.target.value; })} placeholder="Trust title" />
              <Textarea className="min-h-24" value={draft.services.trust.description} onChange={(event) => updateDraft((next) => { next.services.trust.description = event.target.value; })} placeholder="Trust description" />
              <FeatureListEditor items={draft.services.trust.points} label="Trust points" onChange={(items) => updateDraft((next) => { next.services.trust.points = items; })} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeSection === "contact" ? (
        <Card>
          <CardHeader>
            <SectionIntro kicker="Contact" title="Contact page details" />
            <CardDescription>Control the contact page message, support details, and call-to-action buttons your visitors see.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-[#111827]">Hero section</h4>
              <Input value={draft.contact.hero.kicker} onChange={(event) => updateDraft((next) => { next.contact.hero.kicker = event.target.value; })} placeholder="Hero kicker" />
              <Input value={draft.contact.hero.title} onChange={(event) => updateDraft((next) => { next.contact.hero.title = event.target.value; })} placeholder="Hero title" />
              <Textarea className="min-h-24" value={draft.contact.hero.description} onChange={(event) => updateDraft((next) => { next.contact.hero.description = event.target.value; })} placeholder="Hero description" />
              <ImageField
                folder="contact/hero"
                image={draft.contact.hero.image}
                label="Contact hero image"
                onChange={(image) => updateDraft((next) => { next.contact.hero.image = image; })}
                onUpload={(folder, file) => uploadAsset(folder, file, (url) => updateDraft((next) => { next.contact.hero.image.url = url; }))}
                uploading={uploadingField === "contact/hero"}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Input value={draft.contact.request.kicker} onChange={(event) => updateDraft((next) => { next.contact.request.kicker = event.target.value; })} placeholder="Request section kicker" />
              <Input value={draft.contact.request.title} onChange={(event) => updateDraft((next) => { next.contact.request.title = event.target.value; })} placeholder="Request section title" />
              <Textarea className="min-h-24 lg:col-span-2" value={draft.contact.request.description} onChange={(event) => updateDraft((next) => { next.contact.request.description = event.target.value; })} placeholder="Request section description" />
              <Input value={draft.contact.request.primaryCta.label} onChange={(event) => updateDraft((next) => { next.contact.request.primaryCta.label = event.target.value; })} placeholder="Primary button label" />
              <Input value={draft.contact.request.primaryCta.href} onChange={(event) => updateDraft((next) => { next.contact.request.primaryCta.href = event.target.value; })} placeholder="Primary button link" />
              <Input value={draft.contact.request.secondaryCta.label} onChange={(event) => updateDraft((next) => { next.contact.request.secondaryCta.label = event.target.value; })} placeholder="Secondary button label" />
              <Input value={draft.contact.request.secondaryCta.href} onChange={(event) => updateDraft((next) => { next.contact.request.secondaryCta.href = event.target.value; })} placeholder="Secondary button link" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Input value={draft.contact.details.address} onChange={(event) => updateDraft((next) => { next.contact.details.address = event.target.value; })} placeholder="Business address" />
              <Input value={draft.contact.details.email} onChange={(event) => updateDraft((next) => { next.contact.details.email = event.target.value; })} placeholder="Support email" />
              <Input value={draft.contact.details.phone} onChange={(event) => updateDraft((next) => { next.contact.details.phone = event.target.value; })} placeholder="Phone number" />
              <Input value={draft.contact.details.whatsApp} onChange={(event) => updateDraft((next) => { next.contact.details.whatsApp = event.target.value; })} placeholder="WhatsApp number" />
              <Input value={draft.contact.details.responseTime} onChange={(event) => updateDraft((next) => { next.contact.details.responseTime = event.target.value; })} placeholder="Response time note" />
              <Input value={draft.contact.details.privacyNote} onChange={(event) => updateDraft((next) => { next.contact.details.privacyNote = event.target.value; })} placeholder="Privacy note" />
              <Textarea className="min-h-24 lg:col-span-2" value={draft.contact.details.supportNote} onChange={(event) => updateDraft((next) => { next.contact.details.supportNote = event.target.value; })} placeholder="Support note" />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeSection === "footer" ? (
        <Card>
          <CardHeader>
            <SectionIntro kicker="Footer" title="Footer information and social links" />
            <CardDescription>Keep the website footer polished with current contact details, social links, and background imagery.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <Textarea className="min-h-24" value={draft.footer.tagline} onChange={(event) => updateDraft((next) => { next.footer.tagline = event.target.value; })} placeholder="Footer tagline" />
            <div className="grid gap-4 lg:grid-cols-2">
              <Input value={draft.footer.address} onChange={(event) => updateDraft((next) => { next.footer.address = event.target.value; })} placeholder="Footer address" />
              <Input value={draft.footer.email} onChange={(event) => updateDraft((next) => { next.footer.email = event.target.value; })} placeholder="Footer email" />
              <Input value={draft.footer.phone} onChange={(event) => updateDraft((next) => { next.footer.phone = event.target.value; })} placeholder="Footer phone number" />
              <Input value={draft.footer.whatsApp} onChange={(event) => updateDraft((next) => { next.footer.whatsApp = event.target.value; })} placeholder="Footer WhatsApp number" />
              <Input value={draft.footer.responseNote} onChange={(event) => updateDraft((next) => { next.footer.responseNote = event.target.value; })} placeholder="Footer response note" />
            </div>
            <SocialLinksEditor items={draft.footer.socials} onChange={(items) => updateDraft((next) => { next.footer.socials = items; })} />
            <ImageField
              folder="footer/background"
              image={draft.footer.backgroundImage}
              label="Footer background image"
              onChange={(image) => updateDraft((next) => { next.footer.backgroundImage = image; })}
              onUpload={(folder, file) => uploadAsset(folder, file, (url) => updateDraft((next) => { next.footer.backgroundImage.url = url; }))}
              uploading={uploadingField === "footer/background"}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
