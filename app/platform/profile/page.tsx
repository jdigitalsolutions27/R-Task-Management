import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { PageHeader } from "@/components/ui/page-header";
import { requirePlatformSession } from "@/lib/auth/session";

export default async function PlatformProfilePage() {
  const context = await requirePlatformSession();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Profile"
        description="Manage your platform photo, account details, and password from the controller workspace."
      />
      <ProfileSettingsForm company={null} profile={context.profile} />
    </div>
  );
}
