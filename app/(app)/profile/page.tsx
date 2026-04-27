import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";

export default async function ProfilePage() {
  const context = await requireSession("profile:view");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your profile photo, contact details, and account password."
      />
      <ProfileSettingsForm company={context.company} profile={context.profile} />
    </div>
  );
}
