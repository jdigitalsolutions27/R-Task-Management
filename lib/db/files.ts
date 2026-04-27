import { canViewAllCompanyFiles } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/db/audit";
import {
  assertCapabilityContext,
  assertCompanyContext,
  type SessionContext,
} from "@/lib/db/context";
import { getCompanyMap, getPropertyMap, getUserMap } from "@/lib/db/lookups";
import { notifyCompanyUsers } from "@/lib/db/notifications";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getStorageBucket } from "@/lib/utils/env";
import { AppError } from "@/lib/utils/http";
import type { FileFilters, FileWithRelations } from "@/types/app";
import type { FileStatusInput, UploadRecordInput } from "@/lib/validation/schemas";

function assertUploadRole(context: SessionContext, module: UploadRecordInput["module"]) {
  if (context.profile.role === "employee" && module !== "files") {
    throw new AppError("Employees may only upload general file records.", 403);
  }

  if (context.profile.role === "inspector" && module !== "inspections") {
    throw new AppError("Inspectors may only upload inspection records.", 403);
  }
}

function baseFilesQuery(context: SessionContext) {
  const query = context.supabase
    .from("files")
    .select("*")
    .order("created_at", { ascending: false });

  if (canViewAllCompanyFiles(context.profile.role)) {
    const company = assertCompanyContext(context);
    return query.eq("company_id", company.id);
  }

  return query.eq("uploader_id", context.profile.id);
}

async function getLatestReviewMap(context: SessionContext, fileIds: string[]) {
  if (!fileIds.length) {
    return new Map();
  }

  const { data, error } = await context.supabase
    .from("file_status_logs")
    .select("*")
    .in("file_id", fileIds)
    .in("next_status", ["approved", "rejected"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("Unable to load file review comments.", 500);
  }

  const reviewerMap = await getUserMap(
    context.supabase,
    [...new Set(data.map((item) => item.actor_id))],
  );
  const reviewMap = new Map<
    string,
    FileWithRelations["latestReview"]
  >();

  for (const item of data) {
    if (reviewMap.has(item.file_id)) {
      continue;
    }

    reviewMap.set(item.file_id, {
      comment: item.comment,
      createdAt: item.created_at,
      reviewer: reviewerMap.get(item.actor_id) ?? null,
      status: item.next_status,
    });
  }

  return reviewMap;
}

export async function listFiles(context: SessionContext, filters: FileFilters = {}) {
  let query = baseFilesQuery(context);

  if (filters.propertyId) {
    query = query.eq("property_id", filters.propertyId);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.module && filters.module !== "all") {
    query = query.eq("module", filters.module);
  }

  if (filters.search) {
    query = query.or(
      `original_name.ilike.%${filters.search}%,file_name.ilike.%${filters.search}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError("Unable to load files.", 500);
  }

  const companyMap = await getCompanyMap(
    context.supabase,
    [...new Set(data.map((item) => item.company_id))],
  );
  const propertyMap = await getPropertyMap(
    context.supabase,
    [...new Set(data.map((item) => item.property_id))],
  );
  const userMap = await getUserMap(
    context.supabase,
    [...new Set(data.map((item) => item.uploader_id))],
  );
  const latestReviewMap = await getLatestReviewMap(
    context,
    data.map((item) => item.id),
  );

  return data.map(
    (item): FileWithRelations => ({
      ...item,
      company: companyMap.get(item.company_id) ?? null,
      latestReview: latestReviewMap.get(item.id) ?? null,
      property: propertyMap.get(item.property_id) ?? null,
      uploader: userMap.get(item.uploader_id) ?? null,
    }),
  );
}

export async function getFileById(context: SessionContext, fileId: string) {
  const { data, error } = await baseFilesQuery(context).eq("id", fileId).single();

  if (error) {
    throw new AppError("File record not found.", 404);
  }

  return data;
}

export async function listFileStatusLogs(context: SessionContext, fileId: string) {
  const file = await getFileById(context, fileId);

  const { data, error } = await context.supabase
    .from("file_status_logs")
    .select("*")
    .eq("file_id", file.id)
    .eq("company_id", file.company_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("Unable to load the file history.", 500);
  }

  return data;
}

export async function createFileRecord(
  context: SessionContext,
  input: UploadRecordInput,
) {
  assertCapabilityContext(context, "files:upload");
  const company = assertCompanyContext(context);
  assertUploadRole(context, input.module);

  const payload = {
    category: input.category,
    company_id: company.id,
    description: input.description || null,
    eviction_id: input.evictionId || null,
    extension: input.originalName.includes(".")
      ? input.originalName.split(".").pop()?.toLowerCase() ?? null
      : null,
    file_name: input.fileName,
    inspection_id: input.inspectionId || null,
    mime_type: input.mimeType,
    module: input.module,
    original_name: input.originalName,
    property_id: input.propertyId,
    report_id: input.reportId || null,
    size_bytes: input.sizeBytes,
    status: "pending" as const,
    storage_bucket: getStorageBucket(),
    storage_path: input.storagePath,
    uploader_id: context.profile.id,
  };

  const { data, error } = await context.supabase
    .from("files")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Unable to create the file record.", 500);
  }

  const { error: logError } = await context.supabase.from("file_status_logs").insert({
    actor_id: context.profile.id,
    comment: "File uploaded and queued for review.",
    company_id: company.id,
    file_id: data.id,
    next_status: "pending",
    previous_status: null,
  });

  if (logError) {
    throw new AppError("Unable to create the status log entry.", 500);
  }

  await writeAuditLog(context.supabase, {
    action: "upload",
    actor_id: context.profile.id,
    company_id: company.id,
    entity_id: data.id,
    entity_type: "file",
    metadata: { module: input.module, storage_path: input.storagePath },
  });

  await notifyCompanyUsers({
    actionLabel: "Open Files",
    actionPath: "/files",
    companyId: company.id,
    detail: `${data.original_name} was uploaded for review.`,
    eventType: "file_uploaded",
    message: `${context.profile.full_name} uploaded ${data.original_name}.`,
    roles: ["super_admin", "corporate_user"],
    title: "New file uploaded",
  });

  return data;
}

export async function updateFileStatus(
  context: SessionContext,
  fileId: string,
  input: FileStatusInput,
) {
  assertCapabilityContext(context, "files:approve");
  const file = await getFileById(context, fileId);

  const payload = {
    approved_at: input.status === "approved" ? new Date().toISOString() : null,
    approved_by: input.status === "approved" ? context.profile.id : null,
    rejection_comment: input.status === "rejected" ? input.comment ?? null : null,
    status: input.status,
  };

  const { data, error } = await context.supabase
    .from("files")
    .update(payload)
    .eq("id", file.id)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Unable to update the file status.", 500);
  }

  const { error: logError } = await context.supabase.from("file_status_logs").insert({
    actor_id: context.profile.id,
    comment: input.comment ?? null,
    company_id: file.company_id,
    file_id: file.id,
    next_status: input.status,
    previous_status: file.status,
  });

  if (logError) {
    throw new AppError("Unable to append the status history.", 500);
  }

  await writeAuditLog(context.supabase, {
    action: input.status === "approved" ? "approve" : "reject",
    actor_id: context.profile.id,
    company_id: file.company_id,
    entity_id: file.id,
    entity_type: "file",
    metadata: { comment: input.comment ?? null },
  });

  await notifyCompanyUsers({
    actionLabel: "Review File",
    actionPath: "/files",
    companyId: file.company_id,
    detail:
      input.status === "rejected"
        ? input.comment ?? "The file was rejected."
        : input.comment || "The file is ready for download.",
    eventType: input.status === "approved" ? "file_approved" : "file_rejected",
    message:
      input.status === "approved"
        ? `${file.original_name} has been approved.`
        : `${file.original_name} has been rejected.`,
    recipientUserIds: [file.uploader_id],
    title: input.status === "approved" ? "File approved" : "File rejected",
  });

  return data;
}

export async function deleteFileRecord(context: SessionContext, fileId: string) {
  const file = await getFileById(context, fileId);
  const canDeleteOwnPendingOrRejected =
    file.uploader_id === context.profile.id &&
    (file.status === "pending" || file.status === "rejected");

  if (!context.can("files:delete") && !canDeleteOwnPendingOrRejected) {
    throw new AppError("You can only delete your own pending or rejected files.", 403);
  }

  const admin = createAdminSupabaseClient();

  const { error: storageError } = await admin.storage
    .from(file.storage_bucket)
    .remove([file.storage_path]);

  if (storageError) {
    throw new AppError("Unable to remove the file from storage.", 500);
  }

  const { error } = await context.supabase.from("files").delete().eq("id", file.id);

  if (error) {
    throw new AppError("Unable to delete the file record.", 500);
  }

  await writeAuditLog(context.supabase, {
    action: "delete",
    actor_id: context.profile.id,
    company_id: file.company_id,
    entity_id: file.id,
    entity_type: "file",
    metadata: { storage_path: file.storage_path },
  });
}

export async function createFileDownloadUrl(
  context: SessionContext,
  fileId: string,
) {
  return createSignedFileUrl(context, fileId, "download");
}

export async function createFilePreviewUrl(
  context: SessionContext,
  fileId: string,
) {
  return createSignedFileUrl(context, fileId, "preview");
}

async function createSignedFileUrl(
  context: SessionContext,
  fileId: string,
  action: "download" | "preview",
) {
  assertCapabilityContext(context, "files:download");
  const file = await getFileById(context, fileId);
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin.storage
    .from(file.storage_bucket)
    .createSignedUrl(file.storage_path, 60 * 10);

  if (error || !data?.signedUrl) {
    throw new AppError(
      action === "download"
        ? "Unable to create the signed download URL."
        : "Unable to create the signed preview URL.",
      500,
    );
  }

  await writeAuditLog(context.supabase, {
    action,
    actor_id: context.profile.id,
    company_id: file.company_id,
    entity_id: file.id,
    entity_type: "file",
    metadata: { storage_path: file.storage_path },
  });

  return data.signedUrl;
}
