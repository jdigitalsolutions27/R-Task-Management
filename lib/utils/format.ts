import { format, formatDistanceToNowStrict } from "date-fns";

import type {
  ApprovalStatus,
  AppRole,
  EvictionStatus,
  ReportStatus,
  SupportStatus,
  UserStatus,
} from "@/types/app";

export function formatDate(value: string | null | undefined, fallback = "N/A") {
  if (!value) {
    return fallback;
  }

  return format(new Date(value), "MMM d, yyyy");
}

export function formatDateTime(value: string | null | undefined, fallback = "N/A") {
  if (!value) {
    return fallback;
  }

  return format(new Date(value), "MMM d, yyyy h:mm a");
}

export function formatRelativeTime(value: string | null | undefined, fallback = "N/A") {
  if (!value) {
    return fallback;
  }

  return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function titleCase(value: string) {
  return value
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function getRoleLabel(role: AppRole) {
  return titleCase(role);
}

export function getApprovalStatusLabel(status: ApprovalStatus) {
  return titleCase(status);
}

export function getUserStatusLabel(status: UserStatus) {
  return titleCase(status);
}

export function getReportStatusLabel(status: ReportStatus) {
  return titleCase(status);
}

export function getEvictionStatusLabel(status: EvictionStatus) {
  return titleCase(status);
}

export function getSupportStatusLabel(status: SupportStatus) {
  return titleCase(status);
}

export function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");
}

