"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Archive, ArrowUpRight, CheckCheck, Clock3, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useRealtimeRefresh } from "@/components/realtime/use-realtime-refresh";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, getRoleLabel } from "@/lib/utils/format";
import { supportSchema, type SupportInput } from "@/lib/validation/schemas";
import type { SupportTicketWithRelations } from "@/types/app";

type SupportMode = "platform" | "tenant";
type TicketAction = "archive" | "escalate" | "resolve" | "start";

function getTargetLabel(targetLevel: SupportTicketWithRelations["target_level"]) {
  return targetLevel === "platform_admin" ? "Platform Controller" : "Company Admin";
}

export function SupportPanel({
  allowCompanyEscalation = false,
  allowManage = false,
  canCreate = true,
  companyId = null,
  currentUserId = null,
  mode = "tenant",
  tickets,
}: {
  allowCompanyEscalation?: boolean;
  allowManage?: boolean;
  canCreate?: boolean;
  companyId?: string | null;
  currentUserId?: string | null;
  mode?: SupportMode;
  tickets: SupportTicketWithRelations[];
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [targetFilter, setTargetFilter] = useState("all");
  const realtimeSubscriptions = useMemo(() => {
    if (mode === "platform") {
      return [
        { event: "INSERT" as const, filter: "target_level=eq.platform_admin", table: "support_tickets" as const },
        { event: "UPDATE" as const, filter: "target_level=eq.platform_admin", table: "support_tickets" as const },
        { event: "DELETE" as const, filter: "target_level=eq.platform_admin", table: "support_tickets" as const },
      ];
    }

    const filter = allowManage
      ? companyId
        ? `company_id=eq.${companyId}`
        : null
      : currentUserId
        ? `created_by=eq.${currentUserId}`
        : null;

    return filter
      ? [
          { event: "INSERT" as const, filter, table: "support_tickets" as const },
          { event: "UPDATE" as const, filter, table: "support_tickets" as const },
          { event: "DELETE" as const, filter, table: "support_tickets" as const },
        ]
      : [];
  }, [allowManage, companyId, currentUserId, mode]);
  useRealtimeRefresh({
    channelName:
      mode === "platform"
        ? "platform-support-queue"
        : `support-${allowManage ? `company-${companyId}` : `user-${currentUserId}`}`,
    enabled: realtimeSubscriptions.length > 0,
    subscriptions: realtimeSubscriptions,
  });
  const form = useForm<SupportInput>({
    defaultValues: {
      message: "",
      subject: "",
    },
    resolver: zodResolver(supportSchema),
  });

  const filteredTickets = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch =
        !query ||
        [
          ticket.subject,
          ticket.message,
          ticket.creator?.full_name,
          ticket.creator?.email,
          ticket.company?.name,
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesTarget = targetFilter === "all" || ticket.target_level === targetFilter;

      return matchesSearch && matchesStatus && matchesTarget;
    });
  }, [searchTerm, statusFilter, targetFilter, tickets]);

  async function onSubmit(values: SupportInput) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/support", {
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit the support request.");
      }

      form.reset({
        message: "",
        subject: "",
      });
      setSuccessMessage(
        mode === "platform"
          ? "Support request sent to the Platform Controller."
          : allowCompanyEscalation
            ? "Your request was sent to the Platform Controller."
            : "Help request submitted.",
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to submit the support request.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleAction(ticketId: string, action: TicketAction) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setPendingAction(`${ticketId}:${action}`);

    try {
      const endpoint = mode === "platform" ? "/api/platform/support" : "/api/support";
      const response = await fetch(endpoint, {
        body: JSON.stringify({ action, ticketId }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update the support request.");
      }

      setSuccessMessage(
        action === "archive"
          ? "Ticket archived."
          : action === "resolve"
            ? "Ticket marked as resolved."
            : action === "escalate"
              ? "Ticket escalated to the Platform Controller."
              : "Ticket marked as in progress.",
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update the support request.");
    } finally {
      setPendingAction(null);
    }
  }

  const formTitle =
    mode === "platform"
      ? "Platform support is read-only here"
      : allowCompanyEscalation
        ? "Escalate a company issue"
        : "Tell the company admin what happened";
  const formDescription =
    mode === "platform"
      ? "Escalated company issues land here for Platform Internal review."
      : allowCompanyEscalation
        ? "If the company team cannot resolve an issue, send it to the Platform Controller from here."
        : "Use this form when you need help with uploads, approvals, reports, or account access.";
  const queueTitle = mode === "platform" ? "Platform escalations" : "Help requests";
  const emptyTitle =
    mode === "platform" ? "No escalations yet" : "No help requests yet";
  const emptyDescription =
    mode === "platform"
      ? "Escalated company issues will appear here when tenant admins need platform help."
      : "Requests and issue follow-ups will appear here after submission.";

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      {canCreate ? (
        <form
          id="support-ticket-form"
          className="grid gap-5 self-start rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B8933A]">
              {allowCompanyEscalation ? "Escalation form" : "New request"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#111827]">{formTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{formDescription}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Subject</label>
            <Input {...form.register("subject")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Message</label>
            <Textarea {...form.register("message")} />
          </div>
          {errorMessage ? (
            <p className="app-status-banner app-status-banner-error">{errorMessage}</p>
          ) : null}
          {successMessage ? (
            <p className="app-status-banner app-status-banner-success">{successMessage}</p>
          ) : null}
          <div>
            <Button disabled={isPending} type="submit">
              {isPending
                ? "Submitting..."
                : allowCompanyEscalation
                  ? "Send to Platform Controller"
                  : "Submit help request"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B8933A]">Escalation queue</p>
          <h2 className="mt-1 text-xl font-bold text-[#111827]">{queueTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{formDescription}</p>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B8933A]">
            {mode === "platform" ? "Platform queue" : "Company queue"}
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#111827]">{queueTitle}</h2>
        </div>
        {tickets.length ? (
          <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]">
            <div className="app-table-toolbar lg:grid-cols-[1.2fr_0.7fr_0.8fr]">
              <label className="relative block">
                <span className="sr-only">Search support requests</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="app-filter-input"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search subject, message, or requester"
                  value={searchTerm}
                />
              </label>
              <Select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="resolved">Resolved</option>
              </Select>
              <Select onChange={(event) => setTargetFilter(event.target.value)} value={targetFilter}>
                <option value="all">All destinations</option>
                <option value="company_admin">Company admin</option>
                <option value="platform_admin">Platform Controller</option>
              </Select>
            </div>
            <div className="overflow-x-auto">
              <table className="app-data-table">
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Submitted by</th>
                    {mode === "platform" ? <th>Company</th> : null}
                    <th>Destination</th>
                    <th>Status</th>
                    <th>Updated</th>
                    {allowManage ? <th>Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => {
                    const actionKey = (action: TicketAction) => `${ticket.id}:${action}`;

                    return (
                      <tr key={ticket.id}>
                        <td>
                          <p className="font-medium text-slate-900">{ticket.subject}</p>
                          <p className="text-xs text-slate-500">{ticket.message}</p>
                          {ticket.escalated_at ? (
                            <p className="mt-2 text-xs font-medium text-slate-500">
                              Escalated{" "}
                              {ticket.escalatedBy?.full_name ? `by ${ticket.escalatedBy.full_name} ` : ""}
                              on {formatDateTime(ticket.escalated_at!)}
                            </p>
                          ) : null}
                        </td>
                        <td>
                          <p className="font-medium text-slate-900">{ticket.creator?.full_name ?? "Unknown user"}</p>
                          <p className="text-xs text-slate-500">{ticket.creator?.email ?? "No email"}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {ticket.creator?.role ? getRoleLabel(ticket.creator.role) : "Requester"}
                          </p>
                        </td>
                        {mode === "platform" ? (
                          <td className="text-slate-600">
                            <p className="font-medium text-slate-900">{ticket.company?.name ?? "Unknown company"}</p>
                            <p className="text-xs text-slate-500">{ticket.company?.slug ?? "No slug"}</p>
                          </td>
                        ) : null}
                        <td>
                          <Badge
                            className="capitalize"
                            tone={ticket.target_level === "platform_admin" ? "in_progress" : "open"}
                          >
                            {getTargetLabel(ticket.target_level)}
                          </Badge>
                        </td>
                        <td>
                          <Badge tone={ticket.status}>{ticket.status.replace("_", " ")}</Badge>
                          {ticket.status === "resolved" && ticket.resolvedBy ? (
                            <p className="mt-1 text-xs text-slate-500">
                              Resolved by {ticket.resolvedBy.full_name}
                            </p>
                          ) : null}
                        </td>
                        <td className="text-slate-600">{formatDateTime(ticket.updated_at)}</td>
                        {allowManage ? (
                          <td>
                            <div className="flex flex-wrap gap-2">
                              {ticket.status !== "in_progress" && ticket.status !== "resolved" ? (
                                <Button
                                  disabled={pendingAction === actionKey("start")}
                                  onClick={() => handleAction(ticket.id, "start")}
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                >
                                  <Clock3 className="h-3.5 w-3.5" />
                                  Start
                                </Button>
                              ) : null}
                              {ticket.status !== "resolved" ? (
                                <Button
                                  disabled={pendingAction === actionKey("resolve")}
                                  onClick={() => handleAction(ticket.id, "resolve")}
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                >
                                  <CheckCheck className="h-3.5 w-3.5" />
                                  Resolve
                                </Button>
                              ) : (
                                <Button
                                  disabled={pendingAction === actionKey("archive")}
                                  onClick={() => handleAction(ticket.id, "archive")}
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                  Archive
                                </Button>
                              )}
                              {allowCompanyEscalation && ticket.target_level === "company_admin" && ticket.status !== "resolved" ? (
                                <Button
                                  disabled={pendingAction === actionKey("escalate")}
                                  onClick={() => handleAction(ticket.id, "escalate")}
                                  size="sm"
                                  type="button"
                                >
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                  Escalate
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!filteredTickets.length ? (
              <div className="border-t border-[#E2E8F0] p-6">
                <EmptyState
                  description="Try another keyword, status, or destination."
                  title="No help requests match your filters"
                />
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            action={
              canCreate ? (
                <Button
                  onClick={() =>
                    document
                      .getElementById("support-ticket-form")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  type="button"
                  variant="outline"
                >
                  Open form
                </Button>
              ) : undefined
            }
          />
        )}
        {errorMessage && !canCreate ? (
          <p className="app-status-banner app-status-banner-error">{errorMessage}</p>
        ) : null}
        {successMessage && !canCreate ? (
          <p className="app-status-banner app-status-banner-success">{successMessage}</p>
        ) : null}
      </div>
    </div>
  );
}
