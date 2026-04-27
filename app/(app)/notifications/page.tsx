import { NotificationsList } from "@/components/notifications/notifications-list";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { getNotifications } from "@/lib/db/notifications";

export default async function NotificationsPage() {
  const context = await requireSession();
  const notifications = await getNotifications(context, { unreadOnly: true });
  const unreadCount = notifications.length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread update${unreadCount === 1 ? "" : "s"} from your property workflows.`}
      />

      <NotificationsList initialNotifications={notifications} userId={context.profile.id} />
    </div>
  );
}
