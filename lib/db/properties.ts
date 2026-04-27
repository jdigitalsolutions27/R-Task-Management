import { assertCapability } from "@/lib/auth/permissions";
import {
  assertCompanyContext,
  type SessionContext,
} from "@/lib/db/context";
import { AppError } from "@/lib/utils/http";
import type { PropertyInput } from "@/lib/validation/schemas";

export async function listProperties(context: SessionContext) {
  const company = assertCompanyContext(context);

  const { data, error } = await context.supabase
    .from("properties")
    .select("*")
    .eq("company_id", company.id)
    .order("name");

  if (error) {
    throw new AppError("Unable to load properties.", 500);
  }

  return data;
}

export async function upsertProperty(
  context: SessionContext,
  input: PropertyInput,
  propertyId?: string,
) {
  assertCapability(context.profile.role, "properties:manage");
  const company = assertCompanyContext(context);

  const payload = {
    address_line_1: input.addressLine1,
    address_line_2: input.addressLine2 || null,
    city: input.city,
    company_id: company.id,
    country: input.country,
    name: input.name,
    postal_code: input.postalCode,
    reference_code: input.referenceCode,
    state: input.state,
    status: input.status,
  };

  if (propertyId) {
    const { data, error } = await context.supabase
      .from("properties")
      .update(payload)
      .eq("id", propertyId)
      .eq("company_id", company.id)
      .select("*")
      .single();

    if (error) {
      throw new AppError("Unable to update the property.", 500);
    }

    return data;
  }

  const { data, error } = await context.supabase
    .from("properties")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Unable to create the property.", 500);
  }

  return data;
}

export async function deleteProperty(context: SessionContext, propertyId: string) {
  assertCapability(context.profile.role, "properties:manage");
  const company = assertCompanyContext(context);

  const { error } = await context.supabase
    .from("properties")
    .delete()
    .eq("id", propertyId)
    .eq("company_id", company.id);

  if (error) {
    throw new AppError(
      "Unable to delete the property. Remove related files or records first.",
      409,
    );
  }
}

