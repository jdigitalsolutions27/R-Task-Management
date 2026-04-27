"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useRealtimeRefresh } from "@/components/realtime/use-realtime-refresh";
import { FilePicker } from "@/components/ui/file-picker";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uploadManagedFile } from "@/lib/storage/browser-upload";
import { formatDateTime } from "@/lib/utils/format";
import { evictionSchema, type EvictionInput } from "@/lib/validation/schemas";
import type { EvictionWithRelations, Property } from "@/types/app";

export function EvictionManager({
  canDelete,
  companyId,
  evictions,
  properties,
}: {
  canDelete: boolean;
  companyId: string;
  evictions: EvictionWithRelations[];
  properties: Property[];
}) {
  const router = useRouter();
  useRealtimeRefresh({
    channelName: `tenant-evictions-${companyId}`,
    subscriptions: [
      {
        event: "*",
        filter: `company_id=eq.${companyId}`,
        table: "evictions",
      },
    ],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentFileId, setDocumentFileId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<"newest" | "oldest">("newest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const form = useForm<EvictionInput>({
    defaultValues: {
      completedAt: "",
      documentFileId: "",
      filedAt: "",
      propertyId: properties[0]?.id ?? "",
      status: "draft",
      summary: "",
      title: "",
    },
    resolver: zodResolver(evictionSchema),
  });

  const filteredEvictions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return evictions
      .filter((item) => {
        const matchesSearch =
          !query ||
          [item.title, item.summary, item.property?.name]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(query));
        const matchesStatus = statusFilter === "all" || item.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((first, second) => {
        const firstDate = new Date(first.completed_at || first.filed_at || first.created_at).getTime();
        const secondDate = new Date(second.completed_at || second.filed_at || second.created_at).getTime();

        return sortDirection === "newest" ? secondDate - firstDate : firstDate - secondDate;
      });
  }, [evictions, searchTerm, sortDirection, statusFilter]);

  function resetForm() {
    setEditingId(null);
    setDocumentFile(null);
    setDocumentFileId("");
    setErrorMessage(null);
    setSuccessMessage(null);
    form.reset({
      completedAt: "",
      documentFileId: "",
      filedAt: "",
      propertyId: properties[0]?.id ?? "",
      status: "draft",
      summary: "",
      title: "",
    });
  }

  async function onSubmit(values: EvictionInput) {
    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let nextDocumentFileId = documentFileId || values.documentFileId || "";

      if (documentFile) {
        const uploaded = await uploadManagedFile({
          category: "eviction",
          companyId,
          description: values.title,
          file: documentFile,
          module: "evictions",
          propertyId: values.propertyId,
        });
        nextDocumentFileId = uploaded.id;
      }

      const response = await fetch("/api/evictions", {
        body: JSON.stringify({
          ...values,
          documentFileId: nextDocumentFileId,
          id: editingId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save the eviction workflow.");
      }

      resetForm();
      setSuccessMessage(editingId ? "Eviction workflow updated." : "Eviction workflow created.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save the eviction workflow.");
    } finally {
      setIsPending(false);
    }
  }

  function editEviction(item: EvictionWithRelations) {
    setEditingId(item.id);
    setDocumentFileId(item.document_file_id ?? "");
    form.reset({
      completedAt: item.completed_at ?? "",
      documentFileId: item.document_file_id ?? "",
      filedAt: item.filed_at ?? "",
      propertyId: item.property_id,
      status: item.status,
      summary: item.summary ?? "",
      title: item.title,
    });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this eviction record?")) {
      return;
    }

    const response = await fetch(`/api/evictions?id=${id}`, { method: "DELETE" });

    if (!response.ok) {
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form id="create-eviction" className="grid gap-5 rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B8933A]">Eviction workflow</p>
          <h2 className="mt-1 text-xl font-bold text-[#111827]">
            {editingId ? "Edit workflow" : "Create workflow"}
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Title</label>
            <Input {...form.register("title")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Property</label>
            <Select {...form.register("propertyId")}>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <Select {...form.register("status")}>
              <option value="draft">Draft</option>
              <option value="filed">Filed</option>
              <option value="completed">Completed</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Filed at</label>
            <Input type="datetime-local" {...form.register("filedAt")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Completed at</label>
            <Input type="datetime-local" {...form.register("completedAt")} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Summary</label>
          <Textarea {...form.register("summary")} />
        </div>
        <FilePicker
          description="Attach the notice, filing packet, or supporting document bundle."
          file={documentFile}
          id="eviction-document-file"
          label="Document package"
          onChange={setDocumentFile}
        />
        {errorMessage ? (
          <p className="app-status-banner app-status-banner-error">{errorMessage}</p>
        ) : null}
        {successMessage ? (
          <p className="app-status-banner app-status-banner-success">{successMessage}</p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={isPending} type="submit">
            {isPending ? "Saving..." : editingId ? "Update eviction" : "Create eviction"}
          </Button>
          {editingId ? (
            <Button onClick={resetForm} type="button" variant="outline">
              Cancel edit
            </Button>
          ) : null}
        </div>
      </form>

      {evictions.length ? (
        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]">
          <div className="app-table-toolbar">
            <label className="relative block">
              <span className="sr-only">Search evictions</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="app-filter-input"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search workflow, summary, or property"
                value={searchTerm}
              />
            </label>
            <Select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="filed">Filed</option>
              <option value="completed">Completed</option>
            </Select>
            <Select
              onChange={(event) => setSortDirection(event.target.value as "newest" | "oldest")}
              value={sortDirection}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="app-data-table">
              <thead>
                <tr>
                  <th>Workflow</th>
                  <th>Property</th>
                  <th>Status</th>
                  <th>Timeline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvictions.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.summary ?? "No summary"}</p>
                    </td>
                    <td className="text-slate-600">{item.property?.name ?? "N/A"}</td>
                    <td>
                      <Badge tone={item.status}>{item.status}</Badge>
                    </td>
                    <td className="text-slate-600">
                      {formatDateTime(item.completed_at || item.filed_at || item.created_at)}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => editEviction(item)} size="sm" type="button" variant="outline">
                          Edit
                        </Button>
                        {item.document_file_id ? (
                          <a
                            className="inline-flex rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-semibold text-[#111827] shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A646] hover:bg-[#fdf9ed]"
                            href={`/api/files/${item.document_file_id}/download`}
                          >
                            Download documents
                          </a>
                        ) : null}
                        {canDelete ? (
                          <Button onClick={() => handleDelete(item.id)} size="sm" type="button" variant="outline">
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filteredEvictions.length ? (
            <div className="border-t border-[#E2E8F0] p-6">
              <EmptyState
                description="Try another workflow title, property, status, or sort order."
                title="No eviction workflows match your filters"
              />
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title="No eviction workflows yet"
          description="Track draft, filed, and completed eviction packages with linked documents."
          action={
            <Button onClick={() => document.getElementById("create-eviction")?.scrollIntoView({ behavior: "smooth", block: "start" })} type="button" variant="outline">
              Create workflow
            </Button>
          }
        />
      )}
    </div>
  );
}
