import { ActivityHistoryTable } from "@/components/dashboard/activity-history-table";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { getActivityHistory } from "@/lib/db/dashboard";

export default async function HistoryPage() {
  const context = await requireSession("history:view");
  const activities = await getActivityHistory(context);

  return (
    <div className="space-y-8">
      <PageHeader
        title="History"
        description="Admin-only audit history for company workflow actions, file activity, and operational changes."
      />

      <ActivityHistoryTable activities={activities} canManage={context.can("history:manage")} />
    </div>
  );
}
