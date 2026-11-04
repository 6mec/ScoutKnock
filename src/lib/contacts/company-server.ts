import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanyLookup } from "@/lib/radar/lookup";
import { lookupCompanyForUser } from "@/lib/radar/lookup-server";
import {
  companyFromManual,
  isManualCompanyId,
  manualCompanyOf,
  type ManualColumns,
} from "./manual";

const COLUMNS =
  "company_id, label, manual_niche, manual_locality, manual_address, manual_phone, manual_website, manual_reviews, manual_hours";

export type ContactLookup = CompanyLookup & { isManual?: boolean };

// A empresa de um contacto do próprio utilizador. As manuais vêm do que ele escreveu,
// sem chamada ao Google; as outras seguem a consulta normal, com o seu limite.
export async function lookupContactCompany(
  supabase: SupabaseClient,
  contactId: string,
  userId: string,
): Promise<ContactLookup> {
  const { data } = await supabase
    .from("contacts")
    .select(COLUMNS)
    .eq("id", contactId)
    .maybeSingle();
  if (!data) return { status: "unavailable" };

  const contact = data as { company_id: string; label: string } & ManualColumns;
  if (isManualCompanyId(contact.company_id)) {
    return {
      status: "ok",
      isSample: false,
      isManual: true,
      company: companyFromManual(contact.company_id, manualCompanyOf(contact)),
    };
  }

  return lookupCompanyForUser(supabase, contact.company_id, userId);
}
