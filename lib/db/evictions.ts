import { canViewAllCompanyEvictions } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/db/audit";
import {
  assertCapabilityContext,
  assertCompanyContext,
  type SessionContext,
} from "@/lib/db/context";
import { getPropertyMap, getUserMap } from "@/lib/db/lookups";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { AppError } from "@/lib/utils/http";
import type { EvictionInput } from "@/lib/validation/schemas";
import type { EvictionWithRelations } from "@/types/app";

export async function listEvictions(context: SessionContext) {
  assertCapabilityContext(context, "evictions:view");
  const company = assertCompanyContext(context);
  const admin = createAdminSupabaseClient();

  let query = admin
    .from("evictions")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  if (!canViewAllCompanyEvictions(context.profile.role)) {
    query = query.eq("created_by", context.profile.id);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError("Unable to load evictions.", 500);
  }

  const propertyMap = await getPropertyMap(
    admin,
    [...new Set(data.map((item) => item.property_id))],
  );
  const authorMap = await getUserMap(
    admin,
    [...new Set(data.map((item) => item.created_by))],
  );

  return data.map(
    (item): EvictionWithRelations => ({
      ...item,
      author: authorMap.get(item.created_by) ?? null,
      property: propertyMap.get(item.property_id) ?? null,
    }),
  );
}

export async function upsertEviction(
  context: SessionContext,
  input: EvictionInput,
  evictionId?: string,
) {
  assertCapabilityContext(context, "evictions:create");
  const company = assertCompanyContext(context);
  const admin = createAdminSupabaseClient();

  const payload = {
    company_id: company.id,
    completed_at: input.completedAt || null,
    document_file_id: input.documentFileId || null,
    filed_at: input.filedAt || null,
    property_id: input.propertyId,
    status: input.status,
    summary: input.summary || null,
    title: input.title,
  };

  if (evictionId) {
    let updateQuery = admin
      .from("evictions")
      .update(payload)
      .eq("id", evictionId)
      .eq("company_id", company.id);

    if (!canViewAllCompanyEvictions(context.profile.role)) {
      updateQuery = updateQuery.eq("created_by", context.profile.id);
    }

    const { data, error } = await updateQuery.select("*").single();

    if (error) {
      throw new AppError("Unable to update the eviction workflow.", 500);
    }

    await writeAuditLog(context.supabase, {
      action: "update",
      actor_id: context.profile.id,
      company_id: company.id,
      entity_id: data.id,
      entity_type: "eviction",
      metadata: { status: data.status },
    });

    return data;
  }

  const { data, error } = await admin
    .from("evictions")
    .insert({
      ...payload,
      created_by: context.profile.id,
    })
    .select("*")
    .single();

  if (error) {
    throw new AppError("Unable to create the eviction record.", 500);
  }

  await writeAuditLog(context.supabase, {
    action: "create",
    actor_id: context.profile.id,
    company_id: company.id,
    entity_id: data.id,
    entity_type: "eviction",
    metadata: { status: data.status },
  });

  return data;
}

export async function deleteEviction(context: SessionContext, evictionId: string) {
  assertCapabilityContext(context, "evictions:manage");
  const company = assertCompanyContext(context);
  const admin = createAdminSupabaseClient();

  const { error } = await admin
    .from("evictions")
    .delete()
    .eq("id", evictionId)
    .eq("company_id", company.id);

  if (error) {
    throw new AppError("Unable to delete the eviction record.", 500);
  }
}
