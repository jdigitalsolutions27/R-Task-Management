import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { defaultSiteContent } from "@/lib/site-content/defaults";
import { AppError } from "@/lib/utils/http";
import type { SessionContext } from "@/lib/db/context";
import type { SiteContent } from "@/types/site-content";
import type { Json } from "@/types/database";

const SITE_CONTENT_KEY = "default";

function mergeSiteContent(content: Partial<SiteContent> | null | undefined): SiteContent {
  return {
    ...defaultSiteContent,
    ...content,
    header: {
      ...defaultSiteContent.header,
      ...content?.header,
      portalCta: {
        ...defaultSiteContent.header.portalCta,
        ...content?.header?.portalCta,
      },
    },
    about: {
      ...defaultSiteContent.about,
      ...content?.about,
      feature: { ...defaultSiteContent.about.feature, ...content?.about?.feature },
      hero: {
        ...defaultSiteContent.about.hero,
        ...content?.about?.hero,
        image: {
          ...defaultSiteContent.about.hero.image,
          ...content?.about?.hero?.image,
        },
      },
      image: { ...defaultSiteContent.about.image, ...content?.about?.image },
      note: { ...defaultSiteContent.about.note, ...content?.about?.note },
      paragraphs: content?.about?.paragraphs ?? defaultSiteContent.about.paragraphs,
      strengths: content?.about?.strengths ?? defaultSiteContent.about.strengths,
    },
    contact: {
      ...defaultSiteContent.contact,
      ...content?.contact,
      details: { ...defaultSiteContent.contact.details, ...content?.contact?.details },
      hero: {
        ...defaultSiteContent.contact.hero,
        ...content?.contact?.hero,
        image: {
          ...defaultSiteContent.contact.hero.image,
          ...content?.contact?.hero?.image,
        },
      },
      request: {
        ...defaultSiteContent.contact.request,
        ...content?.contact?.request,
        primaryCta: {
          ...defaultSiteContent.contact.request.primaryCta,
          ...content?.contact?.request?.primaryCta,
        },
        secondaryCta: {
          ...defaultSiteContent.contact.request.secondaryCta,
          ...content?.contact?.request?.secondaryCta,
        },
      },
    },
    footer: {
      ...defaultSiteContent.footer,
      ...content?.footer,
      backgroundImage: {
        ...defaultSiteContent.footer.backgroundImage,
        ...content?.footer?.backgroundImage,
      },
      socials: content?.footer?.socials ?? defaultSiteContent.footer.socials,
    },
    home: {
      ...defaultSiteContent.home,
      ...content?.home,
      coverage: {
        ...defaultSiteContent.home.coverage,
        ...content?.home?.coverage,
        highlights: content?.home?.coverage?.highlights ?? defaultSiteContent.home.coverage.highlights,
        image: {
          ...defaultSiteContent.home.coverage.image,
          ...content?.home?.coverage?.image,
        },
      },
      hero: {
        ...defaultSiteContent.home.hero,
        ...content?.home?.hero,
        image: { ...defaultSiteContent.home.hero.image, ...content?.home?.hero?.image },
        primaryCta: {
          ...defaultSiteContent.home.hero.primaryCta,
          ...content?.home?.hero?.primaryCta,
        },
        secondaryCta: {
          ...defaultSiteContent.home.hero.secondaryCta,
          ...content?.home?.hero?.secondaryCta,
        },
      },
      workflow: {
        ...defaultSiteContent.home.workflow,
        ...content?.home?.workflow,
        steps: content?.home?.workflow?.steps ?? defaultSiteContent.home.workflow.steps,
      },
    },
    services: {
      ...defaultSiteContent.services,
      ...content?.services,
      hero: {
        ...defaultSiteContent.services.hero,
        ...content?.services?.hero,
        image: {
          ...defaultSiteContent.services.hero.image,
          ...content?.services?.hero?.image,
        },
      },
      services: content?.services?.services ?? defaultSiteContent.services.services,
      trust: {
        ...defaultSiteContent.services.trust,
        ...content?.services?.trust,
        points: content?.services?.trust?.points ?? defaultSiteContent.services.trust.points,
      },
    },
  };
}

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("site_content")
      .select("*")
      .eq("key", SITE_CONTENT_KEY)
      .maybeSingle();

    if (error) {
      return defaultSiteContent;
    }

    return mergeSiteContent((data?.content ?? null) as Partial<SiteContent> | null);
  } catch {
    return defaultSiteContent;
  }
}

function assertPlatformSiteAccess(context: SessionContext) {
  if (context.profile.role !== "platform_admin") {
    throw new AppError("You do not have access to manage platform website content.", 403);
  }
}

export async function getSiteContentForAdmin(context: SessionContext) {
  assertPlatformSiteAccess(context);

  return getSiteContent();
}

export async function saveSiteContent(
  context: SessionContext,
  content: SiteContent,
) {
  assertPlatformSiteAccess(context);

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("site_content")
    .upsert({
      content: content as unknown as Json,
      key: SITE_CONTENT_KEY,
    }, { onConflict: "key" })
    .select("*")
    .single();

  if (error) {
    throw new AppError("Unable to save site content.", 500);
  }

  return data;
}

export async function resetSiteContent(context: SessionContext) {
  assertPlatformSiteAccess(context);

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("site_content")
    .delete()
    .eq("key", SITE_CONTENT_KEY);

  if (error) {
    throw new AppError("Unable to reset site content.", 500);
  }
}
