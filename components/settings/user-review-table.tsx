"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDateTime, titleCase } from "@/lib/utils/format";
import type { UserProfile } from "@/types/app";

export function UserReviewTable({ users }: { users: UserProfile[] }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [roleByUser, setRoleByUser] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        [user.full_name, user.email, user.role]
          .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, users]);

  const stats = useMemo(() => {
    return users.reduce(
      (summary, user) => {
        if (user.status === "approved") {
          summary.approved += 1;
        } else if (user.status === "pending") {
          summary.pending += 1;
        } else {
          summary.locked += 1;
        }

        return summary;
      },
      { approved: 0, locked: 0, pending: 0 },
    );
  }, [users]);

  async function manageUser(
    userId: string,
    action: "approve" | "reject" | "lock" | "unlock",
  ) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setPendingAction(`${userId}:${action}`);

    try {
      const response = await fetch("/api/settings/users/review", {
        body: JSON.stringify({
          action,
          role: roleByUser[userId] ?? "employee",
          userId,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update the company user.");
      }

      setSuccessMessage(
        action === "approve"
          ? "User approved."
          : action === "unlock"
            ? "User unlocked."
            : action === "lock"
              ? "User locked."
              : "User rejected.",
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update the company user.");
    } finally {
      setPendingAction(null);
    }
  }

  async function deleteUser(userId: string, fullName: string) {
    if (!window.confirm(`Delete ${fullName}'s account from this company? This cannot be undone.`)) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setPendingAction(`${userId}:delete`);

    try {
      const response = await fetch("/api/settings/users/review", {
        body: JSON.stringify({ userId }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete the company user.");
      }

      setSuccessMessage("User deleted.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete the company user.");
    } finally {
      setPendingAction(null);
    }
  }

  function getBadgeTone(status: UserProfile["status"]) {
    if (status === "approved") {
      return "approved" as const;
    }

    if (status === "rejected") {
      return "rejected" as const;
    }

    return "pending" as const;
  }

  function getInitials(fullName: string) {
    return fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }

  return (
    <div className="space-y-6">
      {errorMessage ? <p className="app-status-banner app-status-banner-error">{errorMessage}</p> : null}
      {successMessage ? <p className="app-status-banner app-status-banner-success">{successMessage}</p> : null}

      {users.length ? (
        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]">
          <div className="border-b border-[#E2E8F0] bg-slate-50/70 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Company team access</h3>
                  <p className="max-w-2xl text-sm text-slate-600">
                    Review who belongs to this company, update access roles, and lock or remove accounts when needed.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                    {stats.approved} approved
                  </div>
                  <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
                    {stats.pending} pending
                  </div>
                  <div className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700">
                    {stats.locked} locked
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_260px] lg:min-w-[520px]">
                <label className="relative block">
                  <span className="sr-only">Search company users</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="app-filter-input"
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search user, email, or role"
                    value={searchTerm}
                  />
                </label>
                <Select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                  <option value="all">All statuses</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Locked / rejected</option>
                </Select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="app-data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const busy = pendingAction?.startsWith(`${user.id}:`);

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E2E8F0] bg-slate-100 bg-cover bg-center text-sm font-semibold text-slate-700"
                            style={user.avatar_url ? { backgroundImage: `url(${user.avatar_url})` } : undefined}
                          >
                            {!user.avatar_url ? getInitials(user.full_name) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{user.full_name}</p>
                            <p className="truncate text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-2">
                          <Badge tone="draft">{titleCase(user.role)}</Badge>
                          {user.role !== "super_admin" ? (
                            <Select
                              className="max-w-48"
                              disabled={busy}
                              onChange={(event) =>
                                setRoleByUser((current) => ({
                                  ...current,
                                  [user.id]: event.target.value,
                                }))
                              }
                              value={roleByUser[user.id] ?? user.role}
                            >
                              <option value="employee">Employee</option>
                              <option value="inspector">Inspector</option>
                              <option value="corporate_user">Corporate User</option>
                            </Select>
                          ) : (
                            <p className="text-xs text-slate-500">Primary company admin</p>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="space-y-2">
                          <Badge tone={getBadgeTone(user.status)}>{titleCase(user.status)}</Badge>
                          <p className="text-xs text-slate-500">
                            {user.status === "approved"
                              ? "Can access the company workspace"
                              : user.status === "pending"
                                ? "Waiting to be activated"
                                : "Access is currently disabled"}
                          </p>
                        </div>
                      </td>
                      <td className="text-slate-600">{formatDateTime(user.created_at)}</td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          {user.status === "pending" ? (
                            <>
                              <Button disabled={busy} onClick={() => manageUser(user.id, "approve")} size="sm" type="button">
                                {pendingAction === `${user.id}:approve` ? "Approving..." : "Approve"}
                              </Button>
                              <Button
                                disabled={busy}
                                onClick={() => manageUser(user.id, "reject")}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                {pendingAction === `${user.id}:reject` ? "Rejecting..." : "Reject"}
                              </Button>
                            </>
                          ) : user.status === "approved" ? (
                            <Button
                              className="border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100 hover:text-amber-900"
                              disabled={busy}
                              onClick={() => manageUser(user.id, "lock")}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              {pendingAction === `${user.id}:lock` ? "Locking..." : "Lock"}
                            </Button>
                          ) : (
                            <Button
                              disabled={busy}
                              onClick={() => manageUser(user.id, "unlock")}
                              size="sm"
                              type="button"
                            >
                              {pendingAction === `${user.id}:unlock` ? "Unlocking..." : "Unlock"}
                            </Button>
                          )}
                          <Button
                            className="border-rose-300 bg-rose-50 text-rose-700 hover:border-rose-400 hover:bg-rose-100 hover:text-rose-800"
                            disabled={busy}
                            onClick={() => deleteUser(user.id, user.full_name)}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            {pendingAction === `${user.id}:delete` ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!filteredUsers.length ? (
            <div className="border-t border-[#E2E8F0] p-6">
              <EmptyState
                description="Try a different name, email, role, or status filter."
                title="No company users match your filters"
              />
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title="No company users yet"
          description="When staff members join this company, they will appear here for monitoring and access control."
        />
      )}
    </div>
  );
}
