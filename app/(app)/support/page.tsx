import { SupportPanel } from "@/components/support/support-panel";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { listSupportTickets } from "@/lib/db/support";

export default async function SupportPage() {
  const context = await requireSession("support:view");
  const tickets = await listSupportTickets(context);
  const isCompanyAdmin =
    context.profile.role === "super_admin" || context.profile.role === "corporate_user";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Help & Support"
        description={
          isCompanyAdmin
            ? "Manage company help requests, resolve issues for your team, and escalate only the cases that need platform help."
            : "Send a help request for uploads, approvals, reports, account access, or any workflow issue."
        }
      />
      <SupportPanel
        allowCompanyEscalation={isCompanyAdmin}
        allowManage={isCompanyAdmin}
        companyId={context.company?.id ?? null}
        currentUserId={context.profile.id}
        tickets={tickets}
      />
    </div>
  );
}
