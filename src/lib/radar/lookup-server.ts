import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { reportError } from "@/lib/events/log";
import { lookupCompany } from "./lookup";
import { getCompanyProvider } from "./provider";

export function lookupCompanyForUser(
  supabase: SupabaseClient,
  id: string,
  userId: string,
) {
  return lookupCompany(getCompanyProvider({ userId }), id, async () => {
    const { data, error } = await supabase.rpc("consume_company_lookup");
    if (error) {
      await reportError("radar detalhes limite", error.code, userId);
      return "error";
    }
    return data === true;
  });
}
