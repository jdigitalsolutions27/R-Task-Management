"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { propertySchema, type PropertyInput } from "@/lib/validation/schemas";
import { formatDateTime } from "@/lib/utils/format";
import type { Property } from "@/types/app";

export function PropertyManager({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const form = useForm<PropertyInput>({
    defaultValues: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      country: "United States",
      name: "",
      postalCode: "",
      referenceCode: "",
      state: "",
      status: "active",
    },
    resolver: zodResolver(propertySchema),
  });
  const filteredProperties = properties.filter((property) => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [
      property.name,
      property.reference_code,
      property.address_line_1,
      property.city,
      property.state,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  function resetForm() {
    setEditingId(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    form.reset({
      addressLine1: "",
      addressLine2: "",
      city: "",
      country: "United States",
      name: "",
      postalCode: "",
      referenceCode: "",
      state: "",
      status: "active",
    });
  }

  async function onSubmit(values: PropertyInput) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/properties", {
        body: JSON.stringify({
          ...values,
          id: editingId,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save the property.");
      }

      resetForm();
      setSuccessMessage(editingId ? "Property updated." : "Property created.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save the property.");
    } finally {
      setIsPending(false);
    }
  }

  function editProperty(property: Property) {
    setEditingId(property.id);
    form.reset({
      addressLine1: property.address_line_1,
      addressLine2: property.address_line_2 ?? "",
      city: property.city,
      country: property.country,
      name: property.name,
      postalCode: property.postal_code,
      referenceCode: property.reference_code,
      state: property.state,
      status: property.status,
    });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this property record?")) {
      return;
    }

    const response = await fetch(`/api/properties?id=${id}`, { method: "DELETE" });

    if (!response.ok) {
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div
        className={cn(
          editingId
            ? "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0F172A]/55 px-4 py-8"
            : "",
        )}
      >
      <form className="grid w-full max-w-5xl gap-5 rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B8933A]">Basic info</p>
          <h3 className="mt-1 text-lg font-bold text-[#111827]">
            {editingId ? "Edit property" : "Add property"}
          </h3>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Property name</label>
            <Input {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Reference code</label>
            <Input {...form.register("referenceCode")} placeholder="Example: PROP-001" />
          </div>
        </div>
        <div className="border-t border-[#E2E8F0] pt-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B8933A]">Address</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Address line 1</label>
            <Input {...form.register("addressLine1")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Address line 2</label>
            <Input {...form.register("addressLine2")} />
          </div>
        </div>
        <div className="border-t border-[#E2E8F0] pt-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B8933A]">Status</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">City</label>
            <Input {...form.register("city")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">State</label>
            <Input {...form.register("state")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Postal code</label>
            <Input {...form.register("postalCode")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <Select {...form.register("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Country</label>
          <Input {...form.register("country")} />
        </div>
        {errorMessage ? (
          <p className="app-status-banner app-status-banner-error">{errorMessage}</p>
        ) : null}
        {successMessage ? (
          <p className="app-status-banner app-status-banner-success">{successMessage}</p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={isPending} type="submit">
            {isPending ? "Saving..." : editingId ? "Update property" : "Create property"}
          </Button>
          {editingId ? (
            <Button onClick={resetForm} type="button" variant="outline">
              Cancel edit
            </Button>
          ) : null}
        </div>
      </form>
      </div>

      {properties.length ? (
        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-[0_18px_50px_-38px_rgba(11,19,43,0.55)]">
          <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <label className="relative block max-w-md">
              <span className="sr-only">Search properties</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="app-filter-input"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search property or address"
                value={searchTerm}
              />
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="app-data-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((property) => (
                  <tr key={property.id}>
                    <td>
                      <p className="font-medium text-slate-900">{property.name}</p>
                      <p className="text-xs text-slate-500">{property.reference_code}</p>
                    </td>
                    <td className="text-slate-600">
                      {property.address_line_1}, {property.city}, {property.state}
                    </td>
                    <td>
                      <Badge tone={property.status === "active" ? "approved" : "inactive"}>
                        {property.status}
                      </Badge>
                    </td>
                    <td className="text-slate-600">{formatDateTime(property.updated_at)}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => editProperty(property)} size="sm" type="button" variant="outline">
                          Edit
                        </Button>
                        <Button onClick={() => handleDelete(property.id)} size="sm" type="button" variant="outline">
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filteredProperties.length ? (
            <div className="border-t border-[#E2E8F0] p-6">
              <EmptyState
                description="Try a different property name, reference code, or address."
                title="No properties match your search"
              />
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title="No properties yet"
          description="Add properties to attach uploads and workflows."
          action={
            <Button onClick={() => window.scrollTo({ behavior: "smooth", top: 0 })} type="button" variant="outline">
              Add property
            </Button>
          }
        />
      )}
    </div>
  );
}
