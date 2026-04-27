import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  assertCapabilityContext,
  assertCompanyContext,
  type SessionContext,
} from "@/lib/db/context";
import { notifyCompanyUsers } from "@/lib/db/notifications";
import { AppError } from "@/lib/utils/http";
import type { SupportInput } from "@/lib/validation/schemas";
import type { SupportTicketWithRelations } from "@/types/app";
import type { Database } from "@/types/database";

type SupportTargetLevel = "company_admin" | "platform_admin";
type SupportManageAction = "archive" | "escalate" | "resolve" | "start";
type SupportTicketUpdate = Database["public"]["Tables"]["support_tickets"]["Update"];

function canManageCompanySupport(context: SessionContext) {
  return context.profile.role === "super_admin" || context.profile.role === "corporate_user";
}

async function hydrateSupportTickets(
  tickets: Array<{
    archived_at: string | null;
    company_id: string;
    created_at: string;
    created_by: string;
    escalated_at: string | null;
    escalated_by: string | null;
    id: string;
    message: string;
    resolved_at: string | null;
    resolved_by: string | null;
    status: "open" | "in_progress" | "resolved";
    subject: string;
    target_level: SupportTargetLevel;
    updated_at: string;
  }>,
): Promise<SupportTicketWithRelations[]> {
  const admin = createAdminSupabaseClient();
  const creatorIds = [
    ...new Set(
      tickets.flatMap((ticket) => [ticket.created_by, ticket.escalated_by, ticket.resolved_by].filter(Boolean)),
    ),
  ] as string[];
  const companyIds = [...new Set(tickets.map((ticket) => ticket.company_id))];

  const [{ data: creators, error: creatorsError }, { data: companies, error: companiesError }] =
    await Promise.all([
      creatorIds.length
        ? admin.from("users").select("id, full_name, email, role").in("id", creatorIds)
        : Promise.resolve({ data: [], error: null }),
      companyIds.length
        ? admin.from("companies").select("id, logo_url, name, slug").in("id", companyIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (creatorsError || companiesError) {
    throw new AppError("Unable to load support ticket details.", 500);
  }

  const creatorMap = new Map((creators ?? []).map((user) => [user.id, user]));
  const companyMap = new Map((companies ?? []).map((company) => [company.id, company]));

  return tickets.map((ticket) => ({
    ...ticket,
    company: companyMap.get(ticket.company_id) ?? null,
    creator: creatorMap.get(ticket.created_by) ?? null,
    escalatedBy: ticket.escalated_by ? creatorMap.get(ticket.escalated_by) ?? null : null,
    resolvedBy: ticket.resolved_by ? creatorMap.get(ticket.resolved_by) ?? null : null,
  }));
}

export async function listSupportTickets(context: SessionContext) {
  assertCapabilityContext(context, "support:view");
  const company = assertCompanyContext(context);
  const canManage = canManageCompanySupport(context);

  let query = context.supabase
    .from("support_tickets")
    .select("*")
    .eq("company_id", company.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (canManage) {
    query = query.or(`target_level.eq.company_admin,created_by.eq.${context.profile.id}`);
  } else {
    query = query.eq("created_by", context.profile.id);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError("Unable to load support tickets.", 500);
  }

  return hydrateSupportTickets(data ?? []);
}

export async function listPlatformSupportTickets() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("support_tickets")
    .select("*")
    .eq("target_level", "platform_admin")
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("Unable to load platform support tickets.", 500);
  }

  return hydrateSupportTickets(data ?? []);
}

export async function createSupportTicket(
  context: SessionContext,
  input: SupportInput,
) {
  assertCapabilityContext(context, "support:create");
  const company = assertCompanyContext(context);
  const targetLevel: SupportTargetLevel = canManageCompanySupport(context)
    ? "platform_admin"
    : "company_admin";

  const { data, error } = await context.supabase
    .from("support_tickets")
    .insert({
      company_id: company.id,
      created_by: context.profile.id,
      message: input.message,
      subject: input.subject,
      target_level: targetLevel,
    })
    .select("*")
    .single();

  if (error) {
    throw new AppError("Unable to create the support ticket.", 500);
  }

  if (targetLevel === "company_admin") {
    await notifyCompanyUsers({
      actionLabel: "Open Help & Support",
      actionPath: "/support",
      companyId: company.id,
      detail: input.subject,
      eventType: "support_ticket_created",
      message: `${context.profile.full_name} opened a new help request.`,
      roles: ["super_admin", "corporate_user"],
      title: "New help request",
    });
  }

  return data;
}

export async function manageSupportTicket(
  context: SessionContext,
  ticketId: string,
  action: SupportManageAction,
) {
  assertCapabilityContext(context, "support:view");
  const company = assertCompanyContext(context);

  if (!canManageCompanySupport(context)) {
    throw new AppError("Only company admins can manage help requests.", 403);
  }

  const { data: ticket, error } = await context.supabase
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .eq("company_id", company.id)
    .is("archived_at", null)
    .single();

  if (error || !ticket) {
    throw new AppError("Support ticket not found.", 404);
  }

  const update: SupportTicketUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (action === "start") {
    update.status = "in_progress";
  }

  if (action === "resolve") {
    update.status = "resolved";
    update.resolved_at = new Date().toISOString();
    update.resolved_by = context.profile.id;
  }

  if (action === "archive") {
    if (ticket.status !== "resolved") {
      throw new AppError("Only resolved tickets can be archived.", 400);
    }

    update.archived_at = new Date().toISOString();
  }

  if (action === "escalate") {
    update.target_level = "platform_admin";
    update.status = "open";
    update.escalated_at = new Date().toISOString();
    update.escalated_by = context.profile.id;
  }

  const { data: updatedTicket, error: updateError } = await context.supabase
    .from("support_tickets")
    .update(update)
    .eq("id", ticket.id)
    .select("*")
    .single();

  if (updateError || !updatedTicket) {
    throw new AppError("Unable to update the support ticket.", 500);
  }

  return updatedTicket;
}

export async function managePlatformSupportTicket(
  context: SessionContext,
  ticketId: string,
  action: Exclude<SupportManageAction, "escalate">,
) {
  if (context.profile.role !== "platform_admin") {
    throw new AppError("Only platform admins can manage escalated tickets.", 403);
  }

  const admin = createAdminSupabaseClient();
  const { data: ticket, error } = await admin
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .eq("target_level", "platform_admin")
    .is("archived_at", null)
    .single();

  if (error || !ticket) {
    throw new AppError("Platform support ticket not found.", 404);
  }

  const update: SupportTicketUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (action === "start") {
    update.status = "in_progress";
  }

  if (action === "resolve") {
    update.status = "resolved";
    update.resolved_at = new Date().toISOString();
    update.resolved_by = context.profile.id;
  }

  if (action === "archive") {
    if (ticket.status !== "resolved") {
      throw new AppError("Only resolved tickets can be archived.", 400);
    }

    update.archived_at = new Date().toISOString();
  }

  const { data: updatedTicket, error: updateError } = await admin
    .from("support_tickets")
    .update(update)
    .eq("id", ticket.id)
    .select("*")
    .single();

  if (updateError || !updatedTicket) {
    throw new AppError("Unable to update the platform support ticket.", 500);
  }

  return updatedTicket;
}
