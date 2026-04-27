import { writeAuditLog } from "@/lib/db/audit";
import {
  assertCapabilityContext,
  assertCompanyContext,
  type SessionContext,
} from "@/lib/db/context";
import { getPropertyMap, getUserMap } from "@/lib/db/lookups";
import { notifyCompanyUsers } from "@/lib/db/notifications";
import { AppError } from "@/lib/utils/http";
import type { ReportInput } from "@/lib/validation/schemas";
import type { ReportWithRelations } from "@/types/app";

export async function listReports(context: SessionContext) {
  assertCapabilityContext(context, "reports:view");
  const company = assertCompanyContext(context);

  const { data, error } = await context.supabase
    .from("reports")
    .select("*")
    .eq("company_id", company.id)
    .order("report_date", { ascending: false });

  if (error) {
    throw new AppError("Unable to load shopping reports.", 500);
  }

  const propertyMap = await getPropertyMap(
    context.supabase,
    [...new Set(data.map((item) => item.property_id))],
  );
  const authorMap = await getUserMap(
    context.supabase,
    [...new Set(data.map((item) => item.uploaded_by))],
  );

  return data.map(
    (item): ReportWithRelations => ({
      ...item,
      author: authorMap.get(item.uploaded_by) ?? null,
      property: propertyMap.get(item.property_id) ?? null,
    }),
  );
}

export async function upsertReport(
  context: SessionContext,
  input: ReportInput,
  reportId?: string,
) {
  assertCapabilityContext(context, "reports:create");
  const company = assertCompanyContext(context);

  const payload = {
    company_id: company.id,
    description: input.description || null,
    property_id: input.propertyId,
    report_date: input.reportDate,
    report_file_id: input.reportFileId,
    status: input.status,
    title: input.title,
    uploaded_by: context.profile.id,
    video_file_id: input.videoFileId || null,
  };

  if (reportId) {
    const { data, error } = await context.supabase
      .from("reports")
      .update(payload)
      .eq("id", reportId)
      .eq("company_id", company.id)
      .select("*")
      .single();

    if (error) {
      throw new AppError("Unable to update the shopping report.", 500);
    }

    await writeAuditLog(context.supabase, {
      action: "update",
      actor_id: context.profile.id,
      company_id: company.id,
      entity_id: data.id,
      entity_type: "shopping_report",
      metadata: { status: data.status },
    });

    return data;
  }

  const { data, error } = await context.supabase
    .from("reports")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Unable to create the shopping report.", 500);
  }

  await writeAuditLog(context.supabase, {
    action: "create",
    actor_id: context.profile.id,
    company_id: company.id,
    entity_id: data.id,
    entity_type: "shopping_report",
    metadata: { status: data.status },
  });

  if (data.status === "published") {
    await notifyCompanyUsers({
      actionLabel: "Open Reports",
      actionPath: "/shopping-reports",
      companyId: company.id,
      detail: data.title,
      eventType: "report_available",
      message: `${data.title} is available for download.`,
      title: "New shopping report available",
    });
  }

  return data;
}

export async function deleteReport(context: SessionContext, reportId: string) {
  assertCapabilityContext(context, "reports:manage");
  const company = assertCompanyContext(context);

  const { error } = await context.supabase
    .from("reports")
    .delete()
    .eq("id", reportId)
    .eq("company_id", company.id);

  if (error) {
    throw new AppError("Unable to delete the shopping report.", 500);
  }
}

