// O ciclo do projeto: fases, checklist do modelo, origem e o projeto que nasce de um
// contacto ganho. Só regras puras (sem base de dados), para se poderem testar.
import { ptPT } from "@/i18n/pt-PT";
import type { ProjectPayment } from "./payments";
import type { ClientProject, ProjectKind, ProjectStatus } from "./rules";

export const PROJECT_PHASES = ["accepted", "briefing", "design", "development", "review", "delivery", "maintenance"] as const;
export type ProjectPhase = (typeof PROJECT_PHASES)[number];

export function isProjectPhase(value: unknown): value is ProjectPhase {
  return PROJECT_PHASES.some((phase) => phase === value);
}

// A fase manda no estado: até à revisão está "em curso", depois entregue ou em manutenção.
export function statusForPhase(phase: ProjectPhase): ProjectStatus {
  if (phase === "delivery") return "delivered";
  if (phase === "maintenance") return "maintenance";
  return "in_progress";
}

// Para projetos criados à mão com um estado: a fase que lhe corresponde ("pedido" não tem).
export function phaseForStatus(status: ProjectStatus): ProjectPhase | null {
  switch (status) {
    case "requested":
      return null;
    case "in_progress":
      return "accepted";
    case "delivered":
    case "finished":
      return "delivery";
    case "maintenance":
      return "maintenance";
  }
}

// Ao entrar na entrega ou na manutenção, as datas vazias passam a hoje.
export function datesForPhase(
  phase: ProjectPhase,
  project: Pick<ClientProject, "delivered_on" | "maintenance_since" | "start_date">,
  today: string,
) {
  const dates: { delivered_on?: string; maintenance_since?: string; start_date?: string } = {};
  if (!project.start_date && phase !== "accepted") dates.start_date = today;
  if ((phase === "delivery" || phase === "maintenance") && !project.delivered_on) dates.delivered_on = today;
  if (phase === "maintenance" && !project.maintenance_since) dates.maintenance_since = today;
  return dates;
}

export type ChecklistTemplateItem = { label: string; kind: "ask_testimonial" | null };

// A checklist de entrega de cada tipo de projeto. O último item pede a opinião: ao
// marcá-lo, o trabalho entra no Portfólio como rascunho.
export function checklistTemplate(kind: ProjectKind): ChecklistTemplateItem[] {
  const items = ptPT.projects.cycle.templates;
  const base = kind === "app" ? items.app : kind === "site_booking" ? items.siteBooking : kind === "site" ? items.site : items.other;
  return [...base.map((label) => ({ label, kind: null })), { label: items.askTestimonial, kind: "ask_testimonial" as const }];
}

export type OriginSource = "osm" | "manual" | "google" | "other";

// De onde veio a empresa (pelo identificador) e o nicho e a zona escritos na ficha.
export function originFromContact(contact: { company_id: string; manual_niche: string | null; manual_locality: string | null }) {
  const source: OriginSource = contact.company_id.startsWith("osm-")
    ? "osm"
    : contact.company_id.startsWith("manual-")
      ? "manual"
      : contact.company_id.startsWith("google-") || /^ChI/.test(contact.company_id)
        ? "google"
        : "other";
  return {
    origin_source: source,
    origin_niche: contact.manual_niche?.slice(0, 80) || null,
    origin_locality: contact.manual_locality?.slice(0, 80) || null,
  };
}

// O tipo do projeto pelo texto do serviço da proposta (sem correspondência, site).
export function kindFromService(service: string | null | undefined): ProjectKind {
  const text = (service ?? "").toLowerCase();
  if (/\bapps?\b|aplica/.test(text)) return "app";
  if (/marca[çc]|reserva|agenda/.test(text)) return "site_booking";
  if (/site|p[áa]gina|loja|web/.test(text)) return "site";
  return text ? "other" : "site";
}

export type DealSource = {
  contact: {
    id: string;
    label: string;
    company_id: string;
    manual_niche: string | null;
    manual_locality: string | null;
    deal_value: number | string | null;
  };
  proposal: { id: string; service: string; value: number | string; deposit: number | string | null } | null;
};

const toNumber = (value: number | string | null | undefined) => {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : null;
};

// O projeto que nasce quando o negócio fecha: dados da ficha, valor e sinal da proposta,
// fase "Proposta aceite", checklist do modelo e os pagamentos previstos (sinal e final).
export function projectFromDeal({ contact, proposal }: DealSource, today: string) {
  const kind = kindFromService(proposal?.service);
  const value = toNumber(proposal?.value ?? contact.deal_value);
  const deposit = toNumber(proposal?.deposit);
  const row = {
    contact_id: contact.id,
    proposal_id: proposal?.id ?? null,
    company_name: contact.label.slice(0, 120),
    name: (proposal?.service || ptPT.projects.kinds[kind]).slice(0, 120),
    kind,
    status: "in_progress" as ProjectStatus,
    phase: "accepted" as ProjectPhase,
    build_value: value,
    start_date: today,
    ...originFromContact(contact),
  };
  const payments: { kind: "deposit" | "final"; amount: number; due_on: string | null }[] = [];
  if (deposit && deposit > 0) payments.push({ kind: "deposit", amount: deposit, due_on: today });
  if (value && value > 0) {
    const rest = Math.round((value - (deposit ?? 0)) * 100) / 100;
    if (rest > 0) payments.push({ kind: "final", amount: rest, due_on: null });
  }
  return { row, payments, checklist: checklistTemplate(kind) };
}

export type BillingTask = {
  kind: "billing";
  projectId: string;
  company: string;
  label: "deposit" | "final" | "maintenance" | "build";
  amount: number;
  date: string;
  overdue: boolean;
};

// Cobranças para as próximas tarefas: pagamentos previstos com data e, nos projetos em
// manutenção, a mensalidade do mês sem pagamento registado (lembrete calculado, não guardado).
// O pagamento final sem data aparece quando o projeto chega à entrega.
export function billingTasks(
  projects: Pick<ClientProject, "id" | "company_name" | "status" | "maintenance_monthly" | "maintenance_since" | "delivered_on">[],
  payments: Pick<ProjectPayment, "project_id" | "kind" | "amount" | "status" | "due_on" | "paid_on">[],
  today: string,
): BillingTask[] {
  const tasks: BillingTask[] = [];
  const byId = new Map(projects.map((project) => [project.id, project]));
  for (const payment of payments) {
    if (payment.status !== "expected") continue;
    const project = byId.get(payment.project_id);
    if (!project || project.status === "finished") continue;
    const delivered = project.status === "delivered" || project.status === "maintenance";
    const date = payment.due_on ?? (delivered ? (project.delivered_on ?? today) : null);
    if (!date) continue;
    const amount = toNumber(payment.amount) ?? 0;
    tasks.push({ kind: "billing", projectId: project.id, company: project.company_name, label: payment.kind, amount, date, overdue: date < today });
  }
  const month = today.slice(0, 7);
  for (const project of projects) {
    const monthly = toNumber(project.maintenance_monthly);
    if (project.status !== "maintenance" || !monthly || monthly <= 0) continue;
    if (project.maintenance_since && project.maintenance_since > today) continue;
    const paid = payments.some(
      (payment) =>
        payment.project_id === project.id &&
        payment.kind === "maintenance" &&
        payment.status !== "expected" &&
        (payment.paid_on ?? "").startsWith(month),
    );
    if (paid) continue;
    const date = `${month}-01`;
    tasks.push({ kind: "billing", projectId: project.id, company: project.company_name, label: "maintenance", amount: monthly, date, overdue: false });
  }
  return tasks;
}
