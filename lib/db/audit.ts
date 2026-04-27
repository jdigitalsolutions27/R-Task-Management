import type { SupabaseClient } from "@supabase/supabase-js";

import { AppError } from "@/lib/utils/http";
import type { Database, TableInsert } from "@/types/database";

export async function writeAuditLog(
  client: SupabaseClient<Database>,
  entry: TableInsert<"audit_logs">,
) {
  const { error } = await client.from("audit_logs").insert(entry);

  if (error) {
    throw new AppError("Unable to write the audit log entry.", 500);
  }
}

