"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { todayIn } from "@/lib/demos/booking";
import { reportError } from "@/lib/events/log";
import { datesForPhase, isProjectPhase, statusForPhase } from "@/lib/projects/cycle";
import { PROPOSAL_COLUMNS, parseProposalInput, type Proposal, type ProposalError } from "@/lib/proposals/rules";
import { createClient } from "@/lib/supabase/server";
import { closeDealFor } from "./deal";

// Ligações do ciclo: proposta → projeto → entrega → portfólio → manutenção. Cada ação
// escreve uma vez e o resto da app lê daí (nada se escreve duas vezes).

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTACTS_PATH = "/painel/contactos";
const PROJECTS_PATH = "/painel/projetos";
const OPEN_STATUSES = ["to_contact", "contacted", "replied"];

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  return { supabase, user };
}

function revalidateCycle() {
  revalidatePath("/painel");
  revalidatePath(CONTACTS_PATH);
  revalidatePath(PROJECTS_PATH);
}

// ---------- Propostas ----------

export async function getContactProposals(contactId: string): Promise<{ ok: true; proposals: Proposal[] } | { ok: false }> {
  if (!UUID.test(contactId)) return { ok: false };
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase
    .from("proposals")
    .select(PROPOSAL_COLUMNS)
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) {
    await reportError("propostas ler", error.code, user.id);
    return { ok: false };
  }
  return { ok: true, proposals: (data ?? []) as Proposal[] };
}

// Guardar (criar ou alterar) uma proposta. O valor passa a ser o valor do negócio na ficha;
// enviada põe o contacto em "Proposta"; aceite fecha o negócio e cria o projeto.
export async function saveProposal(
  contactId: string,
  value: unknown,
  proposalId: string | null = null,
): Promise<{ ok: true; id: string; projectCreated: boolean } | { ok: false; error: ProposalError | "generic" }> {
  if (!UUID.test(contactId) || (proposalId !== null && !UUID.test(proposalId))) return { ok: false, error: "generic" };
  const parsed = parseProposalInput(value);
  if (!parsed.ok) return parsed;
  const { supabase, user } = await currentUser();
  const row = {
    service: parsed.input.service,
    value: parsed.input.value,
    deposit: parsed.input.deposit,
    valid_until: parsed.input.validUntil,
    status: parsed.input.status,
  };
  const result = proposalId
    ? await supabase.from("proposals").update(row).eq("id", proposalId).select("id").single()
    : await supabase.from("proposals").insert({ ...row, contact_id: contactId }).select("id").single();
  if (result.error || !result.data) {
    await reportError("propostas guardar", result.error?.code ?? "sem linha", user.id);
    return { ok: false, error: "generic" };
  }
  const id = result.data.id as string;

  const { data: contact } = await supabase.from("contacts").select("status").eq("id", contactId).maybeSingle();
  const contactUpdate: Record<string, unknown> = { deal_value: parsed.input.value };
  if (parsed.input.status === "sent" && contact && OPEN_STATUSES.includes(contact.status as string)) contactUpdate.status = "proposal";
  await supabase.from("contacts").update(contactUpdate).eq("id", contactId);

  let projectCreated = false;
  if (parsed.input.status === "accepted") {
    const deal = await closeDealFor(supabase, user.id, contactId, id);
    projectCreated = deal.ok && deal.created;
  }
  revalidateCycle();
  return { ok: true, id, projectCreated };
}

export async function deleteProposal(id: string): Promise<{ ok: boolean }> {
  if (!UUID.test(id)) return { ok: false };
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase.from("proposals").delete().eq("id", id).select("id");
  if (error) await reportError("propostas apagar", error.code, user.id);
  revalidateCycle();
  return { ok: !error && Boolean(data?.length) };
}

// ---------- Fechar o negócio ----------

export async function closeDeal(contactId: string): Promise<{ ok: true; created: boolean; projectId: string | null } | { ok: false }> {
  if (!UUID.test(contactId)) return { ok: false };
  const { supabase, user } = await currentUser();
  const result = await closeDealFor(supabase, user.id, contactId);
  revalidateCycle();
  return result;
}

// ---------- Ficha do projeto ----------

export async function setProjectPhase(
  projectId: string,
  phase: unknown,
): Promise<{ ok: true; status: string; dates: Record<string, string> } | { ok: false }> {
  if (!UUID.test(projectId) || !isProjectPhase(phase)) return { ok: false };
  const { supabase, user } = await currentUser();
  const { data: project } = await supabase
    .from("client_projects")
    .select("id, status, start_date, delivered_on, maintenance_since")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return { ok: false };
  const dates = datesForPhase(phase, project as { start_date: string | null; delivered_on: string | null; maintenance_since: string | null }, todayIn());
  // Um projeto terminado continua terminado até ser reaberto.
  const status = project.status === "finished" ? "finished" : statusForPhase(phase);
  const { error } = await supabase.from("client_projects").update({ phase, status, ...dates }).eq("id", projectId);
  if (error) {
    await reportError("projetos fase", error.code, user.id);
    return { ok: false };
  }
  revalidateCycle();
  return { ok: true, status, dates };
}

export async function setProjectNextStep(projectId: string, text: unknown): Promise<{ ok: boolean }> {
  if (!UUID.test(projectId) || (text !== null && typeof text !== "string")) return { ok: false };
  const value = typeof text === "string" ? text.trim().slice(0, 200) || null : null;
  const { supabase, user } = await currentUser();
  const { error } = await supabase.from("client_projects").update({ next_step: value }).eq("id", projectId);
  if (error) await reportError("projetos próximo passo", error.code, user.id);
  revalidateCycle();
  return { ok: !error };
}

// Terminar sem manutenção (ou reabrir): o estado volta ao que a fase diz.
export async function setProjectFinished(projectId: string, finished: boolean): Promise<{ ok: true; status: string } | { ok: false }> {
  if (!UUID.test(projectId)) return { ok: false };
  const { supabase, user } = await currentUser();
  const { data: project } = await supabase.from("client_projects").select("phase").eq("id", projectId).maybeSingle();
  if (!project) return { ok: false };
  const phase = isProjectPhase(project.phase) ? project.phase : null;
  const status = finished ? "finished" : phase ? statusForPhase(phase) : "requested";
  const { error } = await supabase.from("client_projects").update({ status }).eq("id", projectId);
  if (error) {
    await reportError("projetos terminar", error.code, user.id);
    return { ok: false };
  }
  revalidateCycle();
  return { ok: true, status };
}

// ---------- Checklist ----------

export type ChecklistItem = {
  id: string;
  project_id: string;
  label: string;
  done: boolean;
  position: number;
  kind: "ask_testimonial" | null;
};

export async function addChecklistItem(projectId: string, label: unknown): Promise<{ ok: true; item: ChecklistItem } | { ok: false }> {
  const text = typeof label === "string" ? label.trim() : "";
  if (!UUID.test(projectId) || !text || text.length > 160) return { ok: false };
  const { supabase, user } = await currentUser();
  const { data: last } = await supabase
    .from("project_checklist_items")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1);
  const position = Math.min(200, ((last?.[0]?.position as number | undefined) ?? -1) + 1);
  const { data, error } = await supabase
    .from("project_checklist_items")
    .insert({ project_id: projectId, label: text, position })
    .select("id, project_id, label, done, position, kind")
    .single();
  if (error || !data) {
    await reportError("checklist acrescentar", error?.code ?? "sem linha", user.id);
    return { ok: false };
  }
  revalidatePath(PROJECTS_PATH);
  return { ok: true, item: data as ChecklistItem };
}

// Marcar "pedir opinião" cria o trabalho no Portfólio como rascunho (não o publica).
export async function setChecklistItemDone(id: string, done: boolean): Promise<{ ok: true; draft: boolean } | { ok: false }> {
  if (!UUID.test(id)) return { ok: false };
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase
    .from("project_checklist_items")
    .update({ done })
    .eq("id", id)
    .select("project_id, kind")
    .single();
  if (error || !data) {
    await reportError("checklist marcar", error?.code ?? "sem linha", user.id);
    return { ok: false };
  }
  let draft = false;
  if (done && data.kind === "ask_testimonial") {
    const { data: project } = await supabase
      .from("client_projects")
      .select("portfolio_show, portfolio_summary, name")
      .eq("id", data.project_id)
      .maybeSingle();
    if (project && !project.portfolio_show) {
      await supabase
        .from("client_projects")
        .update({ portfolio_draft: true, ...(project.portfolio_summary ? {} : { portfolio_summary: (project.name as string).slice(0, 240) }) })
        .eq("id", data.project_id);
      draft = true;
      revalidatePath("/painel/portfolio");
    }
  }
  revalidatePath(PROJECTS_PATH);
  return { ok: true, draft };
}

export async function deleteChecklistItem(id: string): Promise<{ ok: boolean }> {
  if (!UUID.test(id)) return { ok: false };
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase.from("project_checklist_items").delete().eq("id", id).select("id");
  if (error) await reportError("checklist apagar", error.code, user.id);
  revalidatePath(PROJECTS_PATH);
  return { ok: !error && Boolean(data?.length) };
}

// ---------- Pagamentos ----------

export async function markPaymentReceived(id: string): Promise<{ ok: boolean }> {
  if (!UUID.test(id)) return { ok: false };
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase
    .from("client_project_payments")
    .update({ status: "received", paid_on: todayIn() })
    .eq("id", id)
    .eq("status", "expected")
    .select("id");
  if (error) await reportError("pagamentos marcar recebido", error.code, user.id);
  revalidateCycle();
  return { ok: !error && Boolean(data?.length) };
}
