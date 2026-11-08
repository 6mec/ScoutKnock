import "server-only";
import { todayIn } from "@/lib/demos/booking";
import { reportError } from "@/lib/events/log";
import { projectFromDeal } from "@/lib/projects/cycle";
import { PROPOSAL_COLUMNS, type Proposal } from "@/lib/proposals/rules";
import { createAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/team/access";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Partilhado com a mudança de estado do contacto para "Ganho": marca o contacto como ganho,
// aceita a proposta (a indicada ou a mais recente por decidir) e cria o projeto se ainda
// não houver um para esta proposta ou, sem proposta, para este contacto.
// O Comercial não lê nem escreve projetos e pagamentos: quando é ele a fechar, o servidor
// cria o projeto em nome do dono com a chave secreta, só para um contacto do dono.
export async function closeDealFor(
  supabase: Supabase,
  userId: string,
  contactId: string,
  proposalId: string | null = null,
): Promise<{ ok: true; created: boolean; projectId: string | null } | { ok: false }> {
  const { data: contact, error } = await supabase
    .from("contacts")
    .select("id, user_id, label, company_id, manual_niche, manual_locality, deal_value, status")
    .eq("id", contactId)
    .maybeSingle();
  if (error || !contact) {
    if (error) await reportError("negócio ler contacto", error.code, userId);
    return { ok: false };
  }
  const access = await getAccess();
  const asOwner = access.role !== "owner";
  if (asOwner && contact.user_id !== access.workspaceId) return { ok: false };
  const writer = asOwner ? createAdminClient() : supabase;
  const owned = asOwner ? { user_id: access.workspaceId } : {};
  if (contact.status !== "won") await supabase.from("contacts").update({ status: "won" }).eq("id", contactId);

  const { data: proposals } = await supabase
    .from("proposals")
    .select(PROPOSAL_COLUMNS)
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });
  const list = (proposals ?? []) as Proposal[];
  let proposal =
    (proposalId ? list.find((item) => item.id === proposalId) : undefined) ??
    list.find((item) => item.status === "accepted") ??
    list.find((item) => item.status === "sent" || item.status === "draft") ??
    null;
  if (proposal && proposal.status !== "accepted") {
    await supabase.from("proposals").update({ status: "accepted" }).eq("id", proposal.id);
    proposal = { ...proposal, status: "accepted" };
  }

  const existing = proposal
    ? await writer.from("client_projects").select("id").eq("proposal_id", proposal.id).limit(1)
    : await writer.from("client_projects").select("id").eq("contact_id", contactId).limit(1);
  if (existing.data?.length) return { ok: true, created: false, projectId: existing.data[0].id as string };

  const today = todayIn();
  const plan = projectFromDeal(
    {
      contact: {
        id: contact.id as string,
        label: contact.label as string,
        company_id: contact.company_id as string,
        manual_niche: (contact.manual_niche as string | null) ?? null,
        manual_locality: (contact.manual_locality as string | null) ?? null,
        deal_value: (contact.deal_value as number | string | null) ?? null,
      },
      proposal: proposal ? { id: proposal.id, service: proposal.service, value: proposal.value, deposit: proposal.deposit } : null,
    },
    today,
  );
  const inserted = await writer.from("client_projects").insert({ ...plan.row, ...owned }).select("id").single();
  if (inserted.error || !inserted.data) {
    await reportError("negócio criar projeto", inserted.error?.code ?? "sem linha", userId);
    return { ok: false };
  }
  const projectId = inserted.data.id as string;
  const [checklist, payments] = await Promise.all([
    writer.from("project_checklist_items").insert(
      plan.checklist.map((item, position) => ({ ...owned, project_id: projectId, label: item.label, kind: item.kind, position })),
    ),
    plan.payments.length
      ? writer.from("client_project_payments").insert(
          plan.payments.map((payment) => ({
            ...owned,
            project_id: projectId,
            kind: payment.kind,
            amount: payment.amount,
            status: "expected",
            due_on: payment.due_on,
          })),
        )
      : Promise.resolve({ error: null }),
  ]);
  if (checklist.error) await reportError("negócio checklist", checklist.error.code, userId);
  if (payments.error) await reportError("negócio pagamentos", payments.error.code, userId);
  return { ok: true, created: true, projectId };
}
