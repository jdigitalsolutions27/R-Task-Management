import { InspectionManager } from "@/components/inspections/inspection-manager";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { listInspections } from "@/lib/db/inspections";
import { listProperties } from "@/lib/db/properties";

export default async function InspectionsPage() {
  const context = await requireSession("inspections:view");
  const [inspections, properties] = await Promise.all([
    listInspections(context),
    listProperties(context),
  ]);

  if (!context.company) {
    return null;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inspections"
        description="Schedule inspections, attach evidence, and deliver completed field reporting."
        action={
          <a
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#C9A646] bg-[#C9A646] px-4 text-sm font-semibold text-[#111827] shadow-[0_12px_26px_rgba(201,166,70,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#B8933A]"
            href="#create-inspection"
          >
            Create inspection
          </a>
        }
      />
      <InspectionManager
        canDelete={context.can("inspections:manage")}
        companyId={context.company.id}
        inspections={inspections}
        properties={properties}
      />
    </div>
  );
}
