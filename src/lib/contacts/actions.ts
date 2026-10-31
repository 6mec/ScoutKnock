"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { reportError } from "@/lib/events/log";
import { getCompanyProvider } from "@/lib/radar/provider";
import { scoreCompany } from "@/lib/radar/score";
import { SERVICE_IDS } from "@/lib/radar/types";
import { createClient } from "@/lib/supabase/server";
import {
  isContactStatus,
  marksLastContact,
  parseContactDetails,
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

// Os dados da empresa e a nota vêm sempre do servidor, nunca do browser.
export async function saveContact(companyId: string): Promise<Result> {
  const { supabase, user } = await currentUser();

  const company = await getCompanyProvider()?.findById(companyId);
  if (!company) {
    await reportError("contactos guardar", "sem empresa", user.id);
    return { ok: false };
  }

  const { error } = await supabase.from("contacts").insert({
    user_id: user.id,
    company_id: company.id,
    company_name: company.name,
    niche: company.niche,
    locality: company.locality,
    address: company.address,
    phone: company.phone ?? null,
    website: company.website,
    score: scoreCompany(company, SERVICE_IDS[0]).score,
  });

  // Já guardada antes: para quem usa, o resultado é o mesmo.
  if (error && error.code !== UNIQUE_VIOLATION) {
    await reportError("contactos guardar", error.code, user.id);
    return { ok: false };
  }

  revalidatePath(CONTACTS_PATH);
  return { ok: true };
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
