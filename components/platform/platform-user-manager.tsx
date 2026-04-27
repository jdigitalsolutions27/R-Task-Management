"use client";

import { ChevronDown, ShieldCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CompanyLogoMark } from "@/components/company/company-logo-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDateTime, getRoleLabel, getUserStatusLabel } from "@/lib/utils/format";
import type { PlatformUserRecord } from "@/lib/db/platform";

const editableRoles = ["super_admin", "corporate_user", "employee", "inspector"] as const;
const editableStatuses = ["approved", "pending", "rejected"] as const;

function roleSortWeight(role: PlatformUserRecord["role"]) {
  if (role === "super_admin") return 0;
  if (role === "corporate_user") return 1;
  if (role === "inspector") return 2;
  if (role === "employee") return 3;
  return 4;
}

export function PlatformUserManager({
  users,
}: {
  users: PlatformUserRecord[];
}) {
  const router = useRouter();
  const [draftByUser, setDraftByUser] = useState<Record<string, { role: string; status: string }>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery =
        !query ||
        [user.full_name, user.email, user.company?.name ?? "", user.company?.slug ?? ""].some((value) =>
          value.toLowerCase().includes(query),
        );
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  const groupedUsers = useMemo(() => {
    const groups = new Map<
      string,
      {
        companyLabel: string;
        companyLogoUrl: string | null;
        companySlug: string;
        internalAvatarUrl: string | null;
        isPlatformInternal: boolean;
        superAdmin: PlatformUserRecord | null;
        users: PlatformUserRecord[];
      }
    >();

    for (const user of filteredUsers) {
      const groupKey = user.company?.id ?? "platform-internal";
      const current = groups.get(groupKey) ?? {
        companyLabel: user.company?.name ?? "Platform Internal",
        companyLogoUrl: user.company?.logo_url ?? null,
        companySlug: user.company?.slug ?? "internal",
        internalAvatarUrl: !user.company && user.role === "platform_admin" ? user.avatar_url : null,
        isPlatformInternal: !user.company,
        superAdmin: null,
        users: [],
      };

      if (!user.company && user.role === "platform_admin" && user.avatar_url) {
        current.internalAvatarUrl = user.avatar_url;
      }

      if (user.role === "super_admin" && !current.superAdmin) {
        current.superAdmin = user;
      } else {
        current.users.push(user);
      }

      groups.set(groupKey, current);
    }

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        users: group.users.sort((left, right) => {
          const roleDiff = roleSortWeight(left.role) - roleSortWeight(right.role);
          if (roleDiff !== 0) return roleDiff;
          return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
        }),
      }))
      .sort((left, right) => {
        if (left.isPlatformInternal && !right.isPlatformInternal) return -1;
        if (!left.isPlatformInternal && right.isPlatformInternal) return 1;
        return left.companyLabel.localeCompare(right.companyLabel);
      });
  }, [filteredUsers]);

  function getDraft(user: PlatformUserRecord) {
    return draftByUser[user.id] ?? {
      role: user.role,
      status: user.status,
    };
  }

  async function saveUser(user: PlatformUserRecord) {
    if (user.role === "platform_admin") {
      return;
    }

    const draft = getDraft(user);
    setPendingUserId(user.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/platform/users", {
        body: JSON.stringify({
          role: draft.role,
          status: draft.status,
          userId: user.id,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update the user.");
      }

      setSuccessMessage(`${user.full_name} updated.`);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update the user.");
    } finally {
      setPendingUserId(null);
    }
  }

  function renderUserRow(user: PlatformUserRecord) {
    const draft = getDraft(user);
    const isPlatformUser = user.role === "platform_admin";

    return (
      <tr key={user.id}>
        <td className="px-4 py-3">
          <p className="font-semibold text-slate-900">{user.full_name}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </td>
        <td className="px-4 py-3">
          {isPlatformUser ? (
            <Badge tone="approved">{getRoleLabel(user.role)}</Badge>
          ) : (
            <Select
              onChange={(event) =>
                setDraftByUser((current) => ({
                  ...current,
                  [user.id]: {
                    role: event.target.value,
                    status: current[user.id]?.status ?? user.status,
                  },
                }))
              }
              value={draft.role}
            >
              {editableRoles.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </Select>
          )}
        </td>
        <td className="px-4 py-3">
          {isPlatformUser ? (
            <Badge tone="approved">{getUserStatusLabel(user.status)}</Badge>
          ) : (
            <Select
              onChange={(event) =>
                setDraftByUser((current) => ({
                  ...current,
                  [user.id]: {
                    role: current[user.id]?.role ?? user.role,
                    status: event.target.value,
                  },
                }))
              }
              value={draft.status}
            >
              {editableStatuses.map((status) => (
                <option key={status} value={status}>
                  {getUserStatusLabel(status)}
                </option>
              ))}
            </Select>
          )}
        </td>
        <td className="px-4 py-3 text-slate-600">{formatDateTime(user.created_at)}</td>
        <td className="px-4 py-3">
          {isPlatformUser ? (
            <p className="text-xs font-semibold text-slate-400">Internal role locked</p>
          ) : (
            <Button
              disabled={pendingUserId === user.id}
              onClick={() => saveUser(user)}
              size="sm"
              type="button"
            >
              {pendingUserId === user.id ? "Saving..." : "Save"}
            </Button>
          )}
        </td>
      </tr>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#111827]">Global user oversight</h3>
          <p className="mt-1 text-sm text-slate-500">
            Review each company from the top down, starting with the company super admin and then the rest of the team.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search people"
            value={search}
          />
          <Select onChange={(event) => setRoleFilter(event.target.value)} value={roleFilter}>
            <option value="all">All roles</option>
            <option value="platform_admin">Platform Admin</option>
            <option value="super_admin">Super Admin</option>
            <option value="corporate_user">Corporate User</option>
            <option value="employee">Employee</option>
            <option value="inspector">Inspector</option>
          </Select>
          <Select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
            <option value="all">All statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
      </div>

      {errorMessage ? <p className="app-status-banner app-status-banner-error">{errorMessage}</p> : null}
      {successMessage ? <p className="app-status-banner app-status-banner-success">{successMessage}</p> : null}

      {groupedUsers.length ? (
        <div className="space-y-4">
          {groupedUsers.map((group) => (
            <div
              className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] shadow-[0_14px_36px_-30px_rgba(15,23,42,0.25)]"
              key={`${group.companySlug}-${group.companyLabel}`}
            >
              <div className="border-b border-[#E2E8F0] bg-white px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <CompanyLogoMark
                        companyName={group.companyLabel}
                        logoUrl={group.isPlatformInternal ? group.internalAvatarUrl : group.companyLogoUrl}
                        size="md"
                      />
                      <div>
                        <p className="text-lg font-bold text-[#111827]">{group.companyLabel}</p>
                        <p className="mt-1 text-sm text-slate-500">{group.companySlug}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                      <ShieldCheck className="h-4 w-4 text-[#B8933A]" />
                      Company super admin
                    </div>
                    {group.superAdmin ? (
                      <div className="mt-2">
                        <p className="font-semibold text-slate-900">{group.superAdmin.full_name}</p>
                        <p className="text-xs text-slate-500">{group.superAdmin.email}</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">No super admin assigned yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {group.superAdmin ? (
                <div className="overflow-x-auto border-b border-[#E2E8F0] bg-white">
                  <table className="app-data-table min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Super Admin</th>
                        <th className="px-4 py-3 text-left font-medium">Role</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Created</th>
                        <th className="px-4 py-3 text-left font-medium">Save</th>
                      </tr>
                    </thead>
                    <tbody>{renderUserRow(group.superAdmin)}</tbody>
                  </table>
                </div>
              ) : null}

              {group.users.length ? (
                <details className="group" open>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-[#111827] transition-colors hover:bg-white/70">
                    <span className="inline-flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#B8933A]" />
                      {group.users.length} company user{group.users.length === 1 ? "" : "s"}
                    </span>
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      Show users
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                    </span>
                  </summary>
                  <div className="overflow-x-auto border-t border-[#E2E8F0] bg-white">
                    <table className="app-data-table min-w-full text-sm">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">User</th>
                          <th className="px-4 py-3 text-left font-medium">Role</th>
                          <th className="px-4 py-3 text-left font-medium">Status</th>
                          <th className="px-4 py-3 text-left font-medium">Created</th>
                          <th className="px-4 py-3 text-left font-medium">Save</th>
                        </tr>
                      </thead>
                      <tbody>{group.users.map((user) => renderUserRow(user))}</tbody>
                    </table>
                  </div>
                </details>
              ) : (
                <div className="px-5 py-4 text-sm text-slate-500">No other users are linked to this company yet.</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No users found"
          description="Try a different filter or wait for tenant users to join the platform."
        />
      )}
    </div>
  );
}
