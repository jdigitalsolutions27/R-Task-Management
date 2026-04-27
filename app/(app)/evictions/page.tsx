import { EvictionManager } from "@/components/evictions/eviction-manager";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { listEvictions } from "@/lib/db/evictions";
import { listProperties } from "@/lib/db/properties";

export default async function EvictionsPage() {
  const context = await requireSession("evictions:view");
  const [evictions, properties] = await Promise.all([
    listEvictions(context),
    listProperties(context),
  ]);

  if (!context.company) {
    return null;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Evictions"
        description="Manage draft, filed, and completed eviction records with linked document packages."
        action={
          <a
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#C9A646] bg-[#C9A646] px-4 text-sm font-semibold text-[#111827] shadow-[0_12px_26px_rgba(201,166,70,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#B8933A]"
            href="#create-eviction"
          >
            Create workflow
          </a>
        }
      />
      <EvictionManager
        canDelete={context.can("evictions:manage")}
        companyId={context.company.id}
        evictions={evictions}
        properties={properties}
      />
    </div>
  );
}
