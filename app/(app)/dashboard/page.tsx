import Link from "next/link";
import {
  Activity,
  Bell,
  Building2,
  ClipboardList,
  FileArchive,
  FileCheck2,
  FilePlus2,
  FolderClosed,
  Home,
  LifeBuoy,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";

import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireSession } from "@/lib/auth/session";
import { getDashboardMetrics, getRecentActivity } from "@/lib/db/dashboard";

export default async function DashboardPage() {
  const context = await requireSession("dashboard:view");
  const [metrics, activity] = await Promise.all([
    getDashboardMetrics(context),
    getRecentActivity(context),
  ]);
  const isAdminView = context.can("settings:view") || context.can("files:approve");
  const userHasEvictions = context.can("evictions:view");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={
          isAdminView
            ? "Monitor files, approvals, properties, reports, and recent operational movement."
            : "Track your uploads, approval status, notifications, and the latest updates tied to your work."
        }
      />

      {isAdminView ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              href="/files"
              icon={<FolderClosed className="h-5 w-5" />}
              label="Total files"
              trend="Across secure storage"
              value={metrics.totalFiles}
            />
            <StatCard
              href="/approvals"
              icon={<FileCheck2 className="h-5 w-5" />}
              label="Pending approvals"
              trend="Requires review"
              value={metrics.approvalQueue}
            />
            <StatCard
              href="/settings"
              icon={<Building2 className="h-5 w-5" />}
              label="Active properties"
              trend="Available workspaces"
              value={metrics.activeProperties}
            />
            <StatCard
              href="/shopping-reports"
              icon={<ClipboardList className="h-5 w-5" />}
              label="Reports created"
              trend="All report statuses"
              value={metrics.reportsCreated}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard
              href="/evictions"
              icon={<Activity className="h-5 w-5" />}
              label="Active evictions"
              trend="Open workflows"
              value={metrics.openEvictions}
            />
            <StatCard
              href="/inspections"
              icon={<ClipboardList className="h-5 w-5" />}
              label="Recent inspections"
              trend="Completed records"
              value={metrics.completedInspections}
            />
            <StatCard
              href="/notifications"
              icon={<Activity className="h-5 w-5" />}
              label="Unread notifications"
              trend="Workflow updates"
              value={metrics.unreadNotifications}
            />
          </div>
        </>
      ) : (
        <div className={`grid gap-4 md:grid-cols-2 ${userHasEvictions ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
          <StatCard
            href="/files"
            icon={<FolderClosed className="h-5 w-5" />}
            label="My uploads"
            trend="Files you uploaded"
            value={metrics.totalFiles}
          />
          <StatCard
            href="/files"
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Awaiting review"
            trend="Still pending approval"
            value={metrics.approvalQueue}
          />
          <StatCard
            href="/notifications"
            icon={<Activity className="h-5 w-5" />}
            label="Unread notifications"
            trend="Updates for your work"
            value={metrics.unreadNotifications}
          />
          <StatCard
            href="/support"
            icon={<ClipboardList className="h-5 w-5" />}
            label="Support access"
            trend="Need help or follow-up?"
            value="Open"
          />
          {userHasEvictions ? (
            <StatCard
              href="/evictions"
              icon={<FileArchive className="h-5 w-5" />}
              label="My evictions"
              trend="Draft, filed, and completed"
              value={metrics.openEvictions}
            />
          ) : null}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <RecentActivityCard activities={activity} canViewHistory={context.can("history:view")} />

        <Card>
          <CardHeader>
            <CardTitle>{isAdminView ? "Quick actions" : "My next steps"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              className="inline-flex h-11 w-full items-center justify-start gap-2 rounded-md border border-[#C9A646] bg-[#C9A646] px-4 text-sm font-semibold text-[#111827] shadow-[0_12px_26px_rgba(201,166,70,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#B8933A]"
              href={isAdminView ? "/files" : context.can("evictions:create") ? "/evictions" : "/files"}
            >
              {isAdminView ? <FilePlus2 className="h-4 w-4" /> : context.can("evictions:create") ? <FileArchive className="h-4 w-4" /> : <FilePlus2 className="h-4 w-4" />}
              {isAdminView ? "Upload file" : context.can("evictions:create") ? "Create eviction" : "Upload a file"}
            </Link>
            <Link
              className="inline-flex h-11 w-full items-center justify-start gap-2 rounded-md border border-[#0F172A]/65 bg-white px-4 text-sm font-semibold text-[#111827] shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A646] hover:bg-[#fdf9ed]"
              href={isAdminView ? "/shopping-reports" : context.can("files:upload") ? "/files" : "/notifications"}
            >
              {isAdminView ? <ClipboardList className="h-4 w-4" /> : context.can("files:upload") ? <FilePlus2 className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
              {isAdminView ? "Create report" : context.can("files:upload") ? "Upload a file" : "Review notifications"}
            </Link>
            {isAdminView ? (
              <Link
                className="inline-flex h-11 w-full items-center justify-start gap-2 rounded-md border border-[#0F172A]/65 bg-white px-4 text-sm font-semibold text-[#111827] shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A646] hover:bg-[#fdf9ed]"
                href="/settings"
              >
                <Home className="h-4 w-4" />
                Add property
              </Link>
            ) : (
            <Link
              className="inline-flex h-11 w-full items-center justify-start gap-2 rounded-md border border-[#0F172A]/65 bg-white px-4 text-sm font-semibold text-[#111827] shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A646] hover:bg-[#fdf9ed]"
              href={userHasEvictions ? "/notifications" : "/support"}
            >
              {userHasEvictions ? <Bell className="h-4 w-4" /> : <LifeBuoy className="h-4 w-4" />}
              {userHasEvictions ? "Review notifications" : "Contact support"}
            </Link>
          )}
            <div className="mt-5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm leading-6 text-slate-600">
              <div className="mb-2 flex items-center gap-2 font-semibold text-[#111827]">
                <PlusCircle className="h-4 w-4 text-[#B8933A]" />
                {isAdminView ? "Role summary" : "Workspace summary"}
              </div>
              <p>Role: <span className="font-semibold text-slate-900">{context.profile.role}</span></p>
              <p>Company: <span className="font-semibold text-slate-900">{context.company?.name ?? "Global"}</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
