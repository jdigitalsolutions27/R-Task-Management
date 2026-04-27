import { SupportPanel } from "@/components/support/support-panel";
import { PageHeader } from "@/components/ui/page-header";
import { requirePlatformSession } from "@/lib/auth/session";
import { listPlatformSupportTickets } from "@/lib/db/support";

export default async function PlatformSupportPage() {
  const context = await requirePlatformSession();
  const tickets = await listPlatformSupportTickets();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Help & Support"
        description="Review company escalations that need platform-level help, then resolve or archive them once the issue is complete."
      />
      <SupportPanel
        allowManage
        canCreate={false}
        currentUserId={context.profile.id}
        mode="platform"
        tickets={tickets}
      />
    </div>
  );
}
