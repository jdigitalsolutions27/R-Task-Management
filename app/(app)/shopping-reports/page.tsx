import { ReportManager } from "@/components/reports/report-manager";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { listProperties } from "@/lib/db/properties";
import { listReports } from "@/lib/db/reports";

export default async function ShoppingReportsPage() {
  const context = await requireSession("reports:view");
  const [reports, properties] = await Promise.all([
    listReports(context),
    listProperties(context),
  ]);

  if (!context.company) {
    return null;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Shopping Reports"
        description="Publish report packages and supporting video evidence for company download."
        action={
          <a
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#C9A646] bg-[#C9A646] px-4 text-sm font-semibold text-[#111827] shadow-[0_12px_26px_rgba(201,166,70,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#B8933A]"
            href="#create-report"
          >
            Create report
          </a>
        }
      />
      <ReportManager
        canDelete={context.can("reports:manage")}
        companyId={context.company.id}
        properties={properties}
        reports={reports}
      />
    </div>
  );
}
