"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { reportError } from "@/lib/events/log";
import { lookupCompanyForUser } from "@/lib/radar/lookup-server";
import { scoreCompany } from "@/lib/radar/score";
import { SERVICE_IDS, type Opportunity } from "@/lib/radar/types";
import { createClient } from "@/lib/supabase/server";
import {
  isContactStatus,
  marksLastContact,
  parseCompanyId,
  parseContactDetails,
  parseContactLabel,
} from "./rules";

const CONTACTS_PATH = "/painel/contactos";
const UNIQUE_VIOLATION = "23505";

type Result = { ok: boolean };

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  return { supabase, user };
}

// Guarda só o place_id e o nome que o freelancer escreveu, por isso não há chamada paga.
export async function saveContact(
  companyIdValue: unknown,
  labelValue: unknown,
): Promise<Result> {
  const companyId = parseCompanyId(companyIdValue);
  const label = parseContactLabel(labelValue);
  if (!companyId || !label) return { ok: false };

  const { supabase, user } = await currentUser();
  const { error } = await supabase.from("contacts").insert({
    user_id: user.id,
    company_id: companyId,
    label,
  });

  // Já guardada antes: para quem usa, o resultado é o mesmo.
  if (error && error.code !== UNIQUE_VIOLATION) {
    await reportError("contactos guardar", error.code, user.id);
    return { ok: false };
  }

  revalidatePath(CONTACTS_PATH);
  return { ok: true };
}

export type ContactCompany =
  | {
      status: "ok";
      isSample: boolean;
      name: string;
      address: string;
      phone: string | null;
      website: string | null;
      reviewCount: number;
      hasOpeningHours: boolean;
      opportunity: Opportunity;
    }
  | { status: "limit" | "unavailable" };

// Os dados do Google vêm na hora e ficam só no ecrã: nada disto é gravado.
export async function getContactCompany(id: string): Promise<ContactCompany> {
  const { supabase, user } = await currentUser();
  const { data: contact } = await supabase
    .from("contacts")
    .select("company_id")
    .eq("id", id)
    .maybeSingle();
  if (!contact) return { status: "unavailable" };

  const lookup = await lookupCompanyForUser(supabase, contact.company_id, user.id);
  if (lookup.status !== "ok") return lookup;

  const { company, isSample } = lookup;
  return {
    status: "ok",
    isSample,
    name: company.name,
    address: company.address,
    phone: company.phone ?? null,
    website: company.website,
    reviewCount: company.reviewCount,
    hasOpeningHours: company.hasOpeningHours,
    opportunity: scoreCompany(company, SERVICE_IDS[0]),
  };
}

async function updateContact(
  id: string,
  area: string,
  values: Record<string, string | null>,
): Promise<Result> {
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase
    .from("contacts")
    .update(values)
    .eq("id", id)
    .select("id");

  if (error || !data?.length) {
    await reportError(area, error?.code ?? "sem linha", user.id);
    return { ok: false };
  }

  revalidatePath(CONTACTS_PATH);
  return { ok: true };
}

export async function setContactStatus(
  id: string,
  status: unknown,
): Promise<Result> {
  if (!isContactStatus(status)) return { ok: false };

  return updateContact(id, "contactos estado", {
    status,
    ...(marksLastContact(status)
      ? { last_contacted_at: new Date().toISOString() }
      : {}),
  });
}

export async function saveContactDetails(
  id: string,
  value: unknown,
): Promise<Result> {
  const details = parseContactDetails(value);
  if (!details) return { ok: false };

  return updateContact(id, "contactos detalhes", {
    label: details.label,
    confirmed_contact: details.confirmedContact,
    next_action: details.nextAction,
    next_action_at: details.nextActionAt,
    notes: details.notes,
  });
}

export async function removeContact(id: string): Promise<Result> {
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", id)
    .select("id");

  if (error || !data?.length) {
    await reportError("contactos remover", error?.code ?? "sem linha", user.id);
    return { ok: false };
  }

  revalidatePath(CONTACTS_PATH);
  return { ok: true };
}
