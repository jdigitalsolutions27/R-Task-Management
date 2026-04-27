import { ApprovalTable } from "@/components/files/approval-table";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { listFiles } from "@/lib/db/files";

export default async function ApprovalsPage() {
  const context = await requireSession("files:approve");
  const files = await listFiles(context, { status: "pending" });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Approvals"
        description="Approve or reject pending tenant submissions with auditable comments."
      />
      <ApprovalTable companyId={context.company?.id ?? null} files={files} />
    </div>
  );
}
