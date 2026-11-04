"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ptPT } from "@/i18n/pt-PT";
import { reportError } from "@/lib/events/log";
import { createClient } from "@/lib/supabase/server";
import { parseDailyGoal, parseWhatsappTemplate, type ContactEvent } from "./crm";
import {
  MANUAL_PREFIX,
  manualColumns,
  parseCompanyList,
  parseManualCompany,
} from "./manual";
import {
  followUpState,
  isContactStatus,
  marksLastContact,
  parseCompanyId,
  parseContactDetails,
  parseContactLabel,
  parseDealValue,
  type Contact,
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

async function updateContact(
  id: string,
  area: string,
  values: Record<string, string | number | boolean | null>,
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
    deal_value: details.dealValue,
    do_not_contact: details.doNotContact,
  });
}

// Histórico do contacto: só lê a base de dados, sem chamadas pagas.
export async function getContactHistory(
  id: string,
): Promise<{ ok: true; events: ContactEvent[] } | { ok: false }> {
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase
    .from("contact_events")
    .select("contact_id, kind, status, created_at")
    .eq("contact_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    await reportError("contactos historico", error.code, user.id);
    return { ok: false };
  }
  return { ok: true, events: (data ?? []) as ContactEvent[] };
}

// O total da proposta passa a ser o valor da ficha; o contacto passa a "Proposta"
// se ainda não estava fechado.
export async function saveProposalTotal(id: string, value: unknown): Promise<Result> {
  const total = parseDealValue(value);
  if (total === undefined || total === null) return { ok: false };

  const { supabase, user } = await currentUser();
  const { data: current } = await supabase
    .from("contacts")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!current) return { ok: false };

  const closed = current.status === "won" || current.status === "lost";
  const { data, error } = await supabase
    .from("contacts")
    .update({ deal_value: total, ...(closed ? {} : { status: "proposal" }) })
    .eq("id", id)
    .select("id");

  if (error || !data?.length) {
    await reportError("contactos proposta", error?.code ?? "sem linha", user.id);
    return { ok: false };
  }

  revalidatePath(CONTACTS_PATH);
  revalidatePath("/painel");
  return { ok: true };
}

// Vazio volta ao modelo da app.
export async function setWhatsappTemplate(value: unknown): Promise<Result> {
  const template = parseWhatsappTemplate(value);
  if (template === undefined) return { ok: false };

  const { supabase, user } = await currentUser();
  const { data, error } = await supabase
    .from("profiles")
    .update({ whatsapp_template: template })
    .eq("id", user.id)
    .select("id");

  if (error || !data?.length) {
    await reportError("contactos modelo whatsapp", error?.code ?? "sem linha", user.id);
    return { ok: false };
  }

  revalidatePath(CONTACTS_PATH);
  return { ok: true };
}

export async function setDailyGoal(value: unknown): Promise<Result> {
  const goal = parseDailyGoal(value);
  if (!goal) return { ok: false };

  const { supabase, user } = await currentUser();
  const { data, error } = await supabase
    .from("profiles")
    .update({ daily_goal: goal })
    .eq("id", user.id)
    .select("id");

  if (error || !data?.length) {
    await reportError("contactos meta", error?.code ?? "sem linha", user.id);
    return { ok: false };
  }

  revalidatePath(CONTACTS_PATH);
  revalidatePath("/painel");
  return { ok: true };
}

// Modelo fixo com o nome que o freelancer escreveu: sem chamadas ao Google nem à
// Anthropic. Reabrir mostra o mesmo seguimento e nunca conta como outro.
export async function getFollowUp(
  id: string,
): Promise<{ ok: true; text: string; generatedAt: string } | { ok: false }> {
  const { supabase, user } = await currentUser();
  const { data: contact } = await supabase
    .from("contacts")
    .select("label, status, last_contacted_at, follow_up_at")
    .eq("id", id)
    .maybeSingle();
  if (!contact) return { ok: false };

  let generatedAt = contact.follow_up_at as string | null;

  if (!generatedAt) {
    if (followUpState(contact, Date.now()).kind !== "ready") return { ok: false };

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("contacts")
      .update({ follow_up_at: now })
      .eq("id", id)
      .is("follow_up_at", null)
      .select("id");
    if (error || !data?.length) {
      await reportError("contactos seguimento", error?.code ?? "sem linha", user.id);
      return { ok: false };
    }
    generatedAt = now;
    revalidatePath(CONTACTS_PATH);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    ok: true,
    generatedAt,
    text: ptPT.messages.sample.followUp(
      contact.label as string,
      (profile?.display_name as string | null) ?? null,
    ),
  };
}

// Empresas manuais: o id é gerado aqui e começa por "manual-", nunca vem do browser.
export async function addManualContact(
  value: unknown,
): Promise<{ ok: true; contact: Contact } | { ok: false }> {
  const company = parseManualCompany(value);
  if (!company) return { ok: false };

  const { supabase, user } = await currentUser();
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      user_id: user.id,
      company_id: `${MANUAL_PREFIX}${crypto.randomUUID()}`,
      label: company.name,
      ...manualColumns(company),
    })
    .select("*")
    .single();

  if (error || !data) {
    await reportError("contactos manual", error?.code ?? "sem linha", user.id);
    return { ok: false };
  }

  revalidatePath(CONTACTS_PATH);
  return { ok: true, contact: data as Contact };
}

// Colar uma lista: as repetidas, pelo nome ou pelo telefone, ficam de fora.
export async function importManualContacts(
  input: unknown,
): Promise<
  | { ok: true; added: number; duplicates: number; invalid: number; tooMany: boolean }
  | { ok: false }
> {
  if (typeof input !== "string" || input.length > 100_000) return { ok: false };

  const { supabase, user } = await currentUser();
  const { data: existing, error: readError } = await supabase
    .from("contacts")
    .select("label, manual_phone, confirmed_contact");
  if (readError) {
    await reportError("contactos importar", readError.code, user.id);
    return { ok: false };
  }

  const parsed = parseCompanyList(
    input,
    (existing ?? []).map((row) => ({
      label: row.label as string,
      phone: (row.manual_phone ?? row.confirmed_contact) as string | null,
    })),
  );

  if (parsed.companies.length > 0) {
    const { error } = await supabase.from("contacts").insert(
      parsed.companies.map((company) => ({
        user_id: user.id,
        company_id: `${MANUAL_PREFIX}${crypto.randomUUID()}`,
        label: company.name,
        ...manualColumns(company),
      })),
    );
    if (error) {
      await reportError("contactos importar", error.code, user.id);
      return { ok: false };
    }
    revalidatePath(CONTACTS_PATH);
  }

  return {
    ok: true,
    added: parsed.companies.length,
    duplicates: parsed.duplicates,
    invalid: parsed.invalid,
    tooMany: parsed.tooMany,
  };
}

// Só em empresas manuais: o filtro pelo prefixo impede mexer nas do Google.
export async function saveManualCompany(
  id: string,
  value: unknown,
): Promise<Result> {
  const company = parseManualCompany(value);
  if (!company) return { ok: false };

  const { supabase, user } = await currentUser();
  const { data, error } = await supabase
    .from("contacts")
    .update({ label: company.name, ...manualColumns(company) })
    .eq("id", id)
    .like("company_id", `${MANUAL_PREFIX}%`)
    .select("id");

  if (error || !data?.length) {
    await reportError("contactos manual guardar", error?.code ?? "sem linha", user.id);
    return { ok: false };
  }

  revalidatePath(CONTACTS_PATH);
  return { ok: true };
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
