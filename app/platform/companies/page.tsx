import { PlatformCompanyManager } from "@/components/platform/platform-company-manager";
import { PageHeader } from "@/components/ui/page-header";
import { listPlatformCompanies } from "@/lib/db/platform";

export default async function PlatformCompaniesPage() {
  const companies = await listPlatformCompanies();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Client Companies"
        description="Create each client workspace, verify the support email, and guide the first admin setup from one clear directory."
      />
      <PlatformCompanyManager companies={companies} />
    </div>
  );
}
