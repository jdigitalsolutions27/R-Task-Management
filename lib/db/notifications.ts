import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/email/resend";
import type { SessionContext } from "@/lib/db/context";
import { AppError } from "@/lib/utils/http";
import type { AppRole, Notification } from "@/types/app";
import type { Json, TableInsert } from "@/types/database";

interface NotifyCompanyUsersOptions {
  actionLabel?: string;
  actionPath?: string;
  companyId: string;
  detail?: string;
  eventType: string;
  message: string;
  metadata?: Json;
  recipientUserIds?: string[];
  roles?: AppRole[];
  title: string;
}

export async function notifyCompanyUsers(options: NotifyCompanyUsersOptions) {
  const admin = createAdminSupabaseClient();

  let userQuery = admin
    .from("users")
    .select("id, email")
    .eq("status", "approved")
    .eq("company_id", options.companyId);

  if (options.roles?.length) {
    userQuery = userQuery.in("role", options.roles);
  }

  if (options.recipientUserIds?.length) {
    userQuery = userQuery.in("id", options.recipientUserIds);
  }

  const { data: recipients, error: usersError } = await userQuery;

  if (usersError) {
    throw new AppError("Unable to resolve notification recipients.", 500);
  }

  const notificationRows: TableInsert<"notifications">[] =
    recipients.length > 0
      ? recipients.map((recipient) => ({
          company_id: options.companyId,
          event_type: options.eventType,
          message: options.message,
          metadata: options.metadata ?? {},
          recipient_user_id: recipient.id,
          title: options.title,
        }))
      : [
          {
            company_id: options.companyId,
            event_type: options.eventType,
            message: options.message,
            metadata: options.metadata ?? {},
            recipient_user_id: null,
            title: options.title,
          },
        ];

  const { error: notificationError } = await admin
    .from("notifications")
    .insert(notificationRows);

  if (notificationError) {
    throw new AppError("Unable to persist notifications.", 500);
  }

  try {
    await sendNotificationEmail({
      actionLabel: options.actionLabel,
      actionPath: options.actionPath,
      detail: options.detail,
      subject: options.title,
      summary: options.message,
      to: recipients.map((recipient) => recipient.email),
    });
  } catch {
    // Keep the core workflow successful even if outbound email is not configured yet.
  }
}

export async function getNotifications(
  context: SessionContext,
  options?: { unreadOnly?: boolean },
): Promise<Notification[]> {
  let query = context.supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(40);

  if (context.company) {
    query = query
      .eq("company_id", context.company.id)
      .eq("recipient_user_id", context.profile.id);
  } else {
    return [];
  }

  if (options?.unreadOnly) {
    query = query.is("read_at", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError("Unable to load notifications.", 500);
  }

  return data;
}

export async function getUnreadNotificationCount(
  context: SessionContext,
): Promise<number> {
  if (!context.company) {
    return 0;
  }

  const { count, error } = await context.supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("company_id", context.company.id)
    .eq("recipient_user_id", context.profile.id)
    .is("read_at", null);

  if (error) {
    throw new AppError("Unable to load unread notifications.", 500);
  }

  return count ?? 0;
}
