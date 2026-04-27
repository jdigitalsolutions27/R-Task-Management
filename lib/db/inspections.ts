import { writeAuditLog } from "@/lib/db/audit";
import {
  assertCapabilityContext,
  assertCompanyContext,
  type SessionContext,
} from "@/lib/db/context";
import { getPropertyMap, getUserMap } from "@/lib/db/lookups";
import { notifyCompanyUsers } from "@/lib/db/notifications";
import { AppError } from "@/lib/utils/http";
import type { InspectionInput } from "@/lib/validation/schemas";
import type { InspectionWithRelations } from "@/types/app";

export async function listInspections(context: SessionContext) {
  assertCapabilityContext(context, "inspections:view");
  const company = assertCompanyContext(context);

  let query = context.supabase
    .from("inspections")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  if (context.profile.role === "inspector") {
    query = query.eq("inspector_id", context.profile.id);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError("Unable to load inspections.", 500);
  }

  const propertyMap = await getPropertyMap(
    context.supabase,
    [...new Set(data.map((item) => item.property_id))],
  );
  const inspectorMap = await getUserMap(
    context.supabase,
    [...new Set(data.map((item) => item.inspector_id))],
  );

  return data.map(
    (item): InspectionWithRelations => ({
      ...item,
      inspector: inspectorMap.get(item.inspector_id) ?? null,
      property: propertyMap.get(item.property_id) ?? null,
    }),
  );
}

export async function upsertInspection(
  context: SessionContext,
  input: InspectionInput,
  inspectionId?: string,
) {
  assertCapabilityContext(context, "inspections:create");
  const company = assertCompanyContext(context);

  const payload = {
    company_id: company.id,
    completed_at: input.completedAt || null,
    inspector_id: context.profile.id,
    property_id: input.propertyId,
    report_file_id: input.reportFileId || null,
    scheduled_for: input.scheduledFor || null,
    status: input.status,
    summary: input.summary || null,
    title: input.title,
  };

  if (inspectionId) {
    const { data, error } = await context.supabase
      .from("inspections")
      .update(payload)
      .eq("id", inspectionId)
      .eq("company_id", company.id)
      .select("*")
      .single();

    if (error) {
      throw new AppError("Unable to update the inspection.", 500);
    }

    await writeAuditLog(context.supabase, {
      action: "update",
      actor_id: context.profile.id,
      company_id: company.id,
      entity_id: data.id,
      entity_type: "inspection",
      metadata: { status: data.status },
    });

    return data;
  }

  const { data, error } = await context.supabase
    .from("inspections")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Unable to create the inspection.", 500);
  }

  await writeAuditLog(context.supabase, {
    action: "create",
    actor_id: context.profile.id,
    company_id: company.id,
    entity_id: data.id,
    entity_type: "inspection",
    metadata: { status: data.status },
  });

  if (data.status === "completed") {
    await notifyCompanyUsers({
      actionLabel: "Open Inspections",
      actionPath: "/inspections",
      companyId: company.id,
      detail: data.title,
      eventType: "inspection_completed",
      message: `${data.title} has been completed.`,
      roles: ["super_admin", "corporate_user"],
      title: "Inspection completed",
    });
  }

  return data;
}

export async function deleteInspection(context: SessionContext, inspectionId: string) {
  assertCapabilityContext(context, "inspections:manage");
  const company = assertCompanyContext(context);

  const { error } = await context.supabase
    .from("inspections")
    .delete()
    .eq("id", inspectionId)
    .eq("company_id", company.id);

  if (error) {
    throw new AppError("Unable to delete the inspection.", 500);
  }
}

