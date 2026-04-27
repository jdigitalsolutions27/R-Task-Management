import { canViewAllCompanyEvictions, canViewAllCompanyFiles } from "@/lib/auth/permissions";
import {
  assertCompanyContext,
  type SessionContext,
} from "@/lib/db/context";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { AppError } from "@/lib/utils/http";
import { titleCase } from "@/lib/utils/format";
import type {
  ActivityHistoryItem,
  DashboardActivityItem,
  DashboardMetrics,
  UserProfile,
} from "@/types/app";
import type { TableRow } from "@/types/database";

export async function getDashboardMetrics(
  context: SessionContext,
): Promise<DashboardMetrics> {
  const company = assertCompanyContext(context);
  const admin = createAdminSupabaseClient();
  const scopeField = canViewAllCompanyFiles(context.profile.role) ? "company_id" : "uploader_id";
  const scopeValue = canViewAllCompanyFiles(context.profile.role)
    ? company.id
    : context.profile.id;

  const filesQuery = context.supabase
    .from("files")
    .select("*", { count: "exact", head: true })
    .eq(scopeField, scopeValue);

  const approvalsQuery = context.can("files:approve")
    ? context.supabase
        .from("files")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company.id)
        .eq("status", "pending")
    : context.supabase
        .from("files")
        .select("*", { count: "exact", head: true })
        .eq("uploader_id", context.profile.id)
        .eq("status", "pending");

  const inspectionsQuery = context.supabase
    .from("inspections")
    .select("*", { count: "exact", head: true })
    .eq("company_id", company.id)
    .eq("status", "completed");

  const propertiesQuery = context.supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("company_id", company.id)
    .eq("status", "active");

  const reportsQuery = context.supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("company_id", company.id);

  const evictionsQuery = canViewAllCompanyEvictions(context.profile.role)
    ? admin
        .from("evictions")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company.id)
        .neq("status", "completed")
    : admin
        .from("evictions")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company.id)
        .eq("created_by", context.profile.id)
        .neq("status", "completed");

  const notificationsQuery = context.supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("company_id", company.id)
    .eq("recipient_user_id", context.profile.id)
    .is("read_at", null)
    ;

  const [files, approvals, inspections, properties, reports, evictions, notifications] =
    await Promise.all([
      filesQuery,
      approvalsQuery,
      inspectionsQuery,
      propertiesQuery,
      reportsQuery,
      evictionsQuery,
      notificationsQuery,
    ]);

  const errors = [
    files.error,
    approvals.error,
    inspections.error,
    properties.error,
    reports.error,
    evictions.error,
    notifications.error,
  ].filter(Boolean);

  if (errors.length) {
    throw new AppError("Unable to load dashboard metrics.", 500);
  }

  return {
    activeProperties: properties.count ?? 0,
    approvalQueue: approvals.count ?? 0,
    completedInspections: inspections.count ?? 0,
    reportsCreated: reports.count ?? 0,
    openEvictions: evictions.count ?? 0,
    totalFiles: files.count ?? 0,
    unreadNotifications: notifications.count ?? 0,
  };
}

type AuditLogRow = TableRow<"audit_logs">;

function canViewCompanyActivity(context: SessionContext) {
  return context.can("history:view");
}

function formatActivityLabel(item: AuditLogRow) {
  const action = titleCase(item.action);
  const entity = titleCase(item.entity_type);

  if (item.action === "upload" && item.entity_type === "file") {
    return "File uploaded";
  }

  if (item.action === "approve" && item.entity_type === "file") {
    return "File approved";
  }

  if (item.action === "reject" && item.entity_type === "file") {
    return "File rejected";
  }

  if (item.action === "create" && item.entity_type === "inspection") {
    return "Inspection created";
  }

  if (item.action === "create" && item.entity_type === "report") {
    return "Report created";
  }

  return `${action} ${entity}`;
}

function formatActivityDetail(item: AuditLogRow, actor: UserProfile | null) {
  const actorName = actor?.full_name ?? "System";
  const action = titleCase(item.action);
  const entity = titleCase(item.entity_type);

  return `${actorName} performed ${action.toLowerCase()} on ${entity.toLowerCase()}.`;
}

async function getActorMap(context: SessionContext, logs: AuditLogRow[]) {
  const actorIds = [
    ...new Set(logs.map((item) => item.actor_id).filter((id): id is string => Boolean(id))),
  ];

  if (!actorIds.length) {
    return new Map<string, UserProfile>();
  }

  const { data, error } = await context.supabase
    .from("users")
    .select("*")
    .in("id", actorIds);

  if (error) {
    throw new AppError("Unable to load activity actors.", 500);
  }

  return new Map(data.map((actor) => [actor.id, actor]));
}

function mapActivityItem(
  item: AuditLogRow,
  actorMap: Map<string, UserProfile>,
): ActivityHistoryItem {
  const actor = item.actor_id ? actorMap.get(item.actor_id) ?? null : null;

  return {
    actorName: actor?.full_name ?? null,
    createdAt: item.created_at,
    detail: formatActivityDetail(item, actor),
    entityType: item.entity_type,
    id: item.id,
    label: formatActivityLabel(item),
    metadata: item.metadata,
  };
}

export async function getRecentActivity(
  context: SessionContext,
): Promise<DashboardActivityItem[]> {
  const company = assertCompanyContext(context);

  let query = context.supabase
    .from("audit_logs")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  if (!canViewCompanyActivity(context)) {
    query = query.eq("actor_id", context.profile.id);
  }

  const { data, error } = await query.limit(8);

  if (error) {
    throw new AppError("Unable to load activity history.", 500);
  }

  const actorMap = await getActorMap(context, data);

  return data.map((item) => mapActivityItem(item, actorMap));
}

export async function getActivityHistory(
  context: SessionContext,
): Promise<ActivityHistoryItem[]> {
  const company = assertCompanyContext(context);

  if (!canViewCompanyActivity(context)) {
    throw new AppError("You do not have access to activity history.", 403);
  }

  const { data, error } = await context.supabase
    .from("audit_logs")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new AppError("Unable to load activity history.", 500);
  }

  const actorMap = await getActorMap(context, data);

  return data.map((item) => mapActivityItem(item, actorMap));
}
