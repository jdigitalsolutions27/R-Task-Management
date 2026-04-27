import { CompanySettingsForm } from "@/components/settings/company-settings-form";
import { InviteCodeManager } from "@/components/settings/invite-code-manager";
import { PropertyManager } from "@/components/settings/property-manager";
import { UserReviewTable } from "@/components/settings/user-review-table";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { listProperties } from "@/lib/db/properties";
import { listCompanyUsers, listInviteCodes } from "@/lib/db/settings";

export default async function SettingsPage() {
  const context = await requireSession("settings:view");

  if (!context.company) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Settings"
          description="Company settings require an account that is linked to a tenant."
        />
      </div>
    );
  }

  const [users, inviteCodes, properties] = await Promise.all([
    listCompanyUsers(context),
    listInviteCodes(context),
    listProperties(context),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage company branding, property records, invite codes, and company users."
      />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Company profile</h2>
        <CompanySettingsForm company={context.company} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Property management</h2>
        <PropertyManager properties={properties} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Invite codes</h2>
        <InviteCodeManager inviteCodes={inviteCodes} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Company users</h2>
        <UserReviewTable users={users} />
      </section>
    </div>
  );
}
