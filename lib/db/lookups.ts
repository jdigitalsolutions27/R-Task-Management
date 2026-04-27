import type { SupabaseClient } from "@supabase/supabase-js";

import { AppError } from "@/lib/utils/http";
import type { Database } from "@/types/database";

export async function getPropertyMap(
  supabase: SupabaseClient<Database>,
  ids: string[],
) {
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("properties")
    .select("id, name, reference_code")
    .in("id", ids);

  if (error) {
    throw new AppError("Unable to load the requested property records.", 500);
  }

  return new Map(data.map((item) => [item.id, item]));
}

export async function getCompanyMap(
  supabase: SupabaseClient<Database>,
  ids: string[],
) {
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id, name, slug")
    .in("id", ids);

  if (error) {
    throw new AppError("Unable to load the requested company records.", 500);
  }

  return new Map(data.map((item) => [item.id, item]));
}

export async function getUserMap(
  supabase: SupabaseClient<Database>,
  ids: string[],
) {
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, role")
    .in("id", ids);

  if (error) {
    throw new AppError("Unable to load the requested user records.", 500);
  }

  return new Map(data.map((item) => [item.id, item]));
}
