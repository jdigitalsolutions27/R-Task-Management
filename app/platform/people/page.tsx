import { PlatformUserManager } from "@/components/platform/platform-user-manager";
import { PageHeader } from "@/components/ui/page-header";
import { listPlatformUsers } from "@/lib/db/platform";

export default async function PlatformPeoplePage() {
  const users = await listPlatformUsers();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Users & Access"
        description="Review all users across the platform, approve access, and keep each person in the correct company role."
      />
      <PlatformUserManager users={users} />
    </div>
  );
}
