"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils/format";
import { inviteCodeSchema } from "@/lib/validation/schemas";
import type { InviteCode } from "@/types/app";

export function InviteCodeManager({ inviteCodes }: { inviteCodes: InviteCode[] }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const form = useForm<
    z.input<typeof inviteCodeSchema>,
    unknown,
    z.output<typeof inviteCodeSchema>
  >({
    defaultValues: {
      active: true,
      expiresAt: "",
      maxUses: undefined,
      role: "employee",
    },
    resolver: zodResolver(inviteCodeSchema),
  });

  const filteredInviteCodes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return inviteCodes.filter((code) => {
      const matchesSearch =
        !query || [code.code, code.role].some((value) => value.toLowerCase().includes(query));
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? code.active : !code.active);

      return matchesSearch && matchesStatus;
    });
  }, [inviteCodes, searchTerm, statusFilter]);

  async function onSubmit(values: z.output<typeof inviteCodeSchema>) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/settings/invite-codes", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create the invite code.");
      }

      form.reset({
        active: true,
        expiresAt: "",
        maxUses: undefined,
        role: "employee",
      });
      setSuccessMessage("Invite code created.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create the invite code.");
    } finally {
      setIsPending(false);
    }
  }

  async function deactivateInvite(id: string) {
    setSuccessMessage(null);
    const response = await fetch(`/api/settings/invite-codes?id=${id}`, { method: "DELETE" });

    if (!response.ok) {
      return;
    }

    setSuccessMessage("Invite code deactivated.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form
        className="grid gap-5 rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B8933A]">Access control</p>
          <h3 className="mt-1 text-lg font-bold text-[#111827]">Create invite code</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Generate role-specific invite codes for staff, inspectors, and corporate users.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <Select {...form.register("role")}>
              <option value="employee">Employee</option>
              <option value="inspector">Inspector</option>
              <option value="corporate_user">Corporate User</option>
            </Select>
            <p className="text-xs text-rose-600">{form.formState.errors.role?.message}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Max uses</label>
            <Input
              type="number"
              onChange={(event) =>
                form.setValue("maxUses", event.target.value ? Number(event.target.value) : undefined)}
            />
            <p className="text-xs text-slate-500">Leave blank for unlimited uses.</p>
            <p className="text-xs text-rose-600">{form.formState.errors.maxUses?.message}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Expires at</label>
            <Input type="datetime-local" {...form.register("expiresAt")} />
            <p className="text-xs text-slate-500">Optional automatic expiry for temporary access.</p>
            <p className="text-xs text-rose-600">{form.formState.errors.expiresAt?.message}</p>
          </div>
        </div>
        <label className="flex items-center gap-3 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-slate-700">
          <input type="checkbox" {...form.register("active")} />
          Set the invite code active immediately
        </label>
        {errorMessage ? (
          <p className="app-status-banner app-status-banner-error">{errorMessage}</p>
        ) : null}
        {successMessage ? (
          <p className="app-status-banner app-status-banner-success">{successMessage}</p>
        ) : null}
        <div>
          <Button disabled={isPending} type="submit">
            {isPending ? "Creating..." : "Create invite code"}
          </Button>
        </div>
      </form>

      {inviteCodes.length ? (
        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]">
          <div className="app-table-toolbar">
            <label className="relative block">
              <span className="sr-only">Search invite codes</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="app-filter-input"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search code or role"
                value={searchTerm}
              />
            </label>
            <Select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="app-data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Role</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInviteCodes.map((code) => (
                  <tr key={code.id}>
                    <td className="font-mono text-sm text-slate-900">{code.code}</td>
                    <td className="text-slate-600">{code.role}</td>
                    <td className="text-slate-600">
                      {code.used_count}/{code.max_uses ?? "Unlimited"}
                    </td>
                    <td>
                      <Badge tone={code.active ? "approved" : "inactive"}>
                        {code.active ? "active" : "inactive"}
                      </Badge>
                    </td>
                    <td className="text-slate-600">{formatDateTime(code.expires_at)}</td>
                    <td>
                      <Button onClick={() => deactivateInvite(code.id)} size="sm" type="button" variant="outline">
                        Deactivate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filteredInviteCodes.length ? (
            <div className="border-t border-[#E2E8F0] p-6">
              <EmptyState
                description="Try another code, role, or status filter."
                title="No invite codes match your filters"
              />
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title="No invite codes yet"
          description="Generate codes to pre-approve company signups."
          action={
            <Button onClick={() => window.scrollTo({ behavior: "smooth", top: 0 })} type="button" variant="outline">
              Create invite code
            </Button>
          }
        />
      )}
    </div>
  );
}
