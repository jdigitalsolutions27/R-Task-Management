import { SiteContentManager } from "@/components/settings/site-content-manager";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { requirePlatformSession } from "@/lib/auth/session";
import { getSiteContentForAdmin } from "@/lib/db/site-content";

export default async function PlatformContentPage() {
  const context = await requirePlatformSession();
  const siteContent = await getSiteContentForAdmin(context);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Website Manager"
        description="Update website text, images, footer details, and call-to-action links from one guided editor designed for non-technical updates."
        action={
          <a href="/" rel="noreferrer" target="_blank">
            <Button type="button" variant="outline">Preview live website</Button>
          </a>
        }
      />
      <SiteContentManager initialContent={siteContent} />
    </div>
  );
}
