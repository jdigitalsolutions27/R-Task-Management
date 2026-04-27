import type { User } from "@supabase/supabase-js";

import type { Database, TableRow } from "@/types/database";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type ApprovalStatus = Database["public"]["Enums"]["approval_status"];
export type CompanyStatus = Database["public"]["Enums"]["company_status"];
export type UserStatus = Database["public"]["Enums"]["user_status"];
export type FileCategory = Database["public"]["Enums"]["file_category"];
export type ModuleKind = Database["public"]["Enums"]["module_kind"];
export type InspectionStatus = Database["public"]["Enums"]["inspection_status"];
export type ReportStatus = Database["public"]["Enums"]["report_status"];
export type EvictionStatus = Database["public"]["Enums"]["eviction_status"];
export type SupportStatus = Database["public"]["Enums"]["support_status"];

export type Company = TableRow<"companies">;
export type CompanyAccessToken = TableRow<"company_access_tokens">;
export type AuditLog = TableRow<"audit_logs">;
export type UserProfile = TableRow<"users">;
export type Property = TableRow<"properties">;
export type FileRecord = TableRow<"files">;
export type Inspection = TableRow<"inspections">;
export type ShoppingReport = TableRow<"reports">;
export type Eviction = TableRow<"evictions">;
export type Notification = TableRow<"notifications">;
export type InviteCode = TableRow<"company_invite_codes">;
export type SupportTicket = TableRow<"support_tickets">;

export type Capability =
  | "dashboard:view"
  | "history:view"
  | "history:manage"
  | "files:view"
  | "files:upload"
  | "files:approve"
  | "files:delete"
  | "files:download"
  | "inspections:view"
  | "inspections:create"
  | "inspections:manage"
  | "reports:view"
  | "reports:create"
  | "reports:manage"
  | "evictions:view"
  | "evictions:create"
  | "evictions:manage"
  | "support:view"
  | "support:create"
  | "profile:view"
  | "profile:manage"
  | "settings:view"
  | "settings:manage"
  | "properties:manage"
  | "users:approve";

export interface RequestContext {
  authUser: User;
  company: Company | null;
  profile: UserProfile;
}

export interface FileFilters {
  module?: ModuleKind | "all";
  propertyId?: string;
  status?: ApprovalStatus | "all";
  search?: string;
}

export interface DashboardMetrics {
  activeProperties: number;
  approvalQueue: number;
  completedInspections: number;
  reportsCreated: number;
  openEvictions: number;
  unreadNotifications: number;
  totalFiles: number;
}

export interface DashboardActivityItem {
  id: string;
  createdAt: string;
  label: string;
  detail: string;
  entityType: string;
  actorName: string | null;
}

export interface ActivityHistoryItem extends DashboardActivityItem {
  metadata: Database["public"]["Tables"]["audit_logs"]["Row"]["metadata"];
}

export interface FileWithRelations extends FileRecord {
  company: Pick<Company, "id" | "name" | "slug"> | null;
  latestReview: {
    comment: string | null;
    createdAt: string;
    reviewer: Pick<UserProfile, "id" | "full_name" | "email" | "role"> | null;
    status: ApprovalStatus;
  } | null;
  property: Pick<Property, "id" | "name" | "reference_code"> | null;
  uploader: Pick<UserProfile, "id" | "full_name" | "email" | "role"> | null;
}

export interface InspectionWithRelations extends Inspection {
  property: Pick<Property, "id" | "name" | "reference_code"> | null;
  inspector: Pick<UserProfile, "id" | "full_name" | "email"> | null;
}

export interface ReportWithRelations extends ShoppingReport {
  property: Pick<Property, "id" | "name" | "reference_code"> | null;
  author: Pick<UserProfile, "id" | "full_name" | "email"> | null;
}

export interface EvictionWithRelations extends Eviction {
  property: Pick<Property, "id" | "name" | "reference_code"> | null;
  author: Pick<UserProfile, "id" | "full_name" | "email"> | null;
}

export interface SupportTicketWithRelations extends SupportTicket {
  company: Pick<Company, "id" | "logo_url" | "name" | "slug"> | null;
  creator: Pick<UserProfile, "id" | "full_name" | "email" | "role"> | null;
  escalatedBy: Pick<UserProfile, "id" | "full_name" | "email" | "role"> | null;
  resolvedBy: Pick<UserProfile, "id" | "full_name" | "email" | "role"> | null;
}

export interface NavItem {
  href: string;
  label: string;
  capability: Capability;
}
