// Números do Início, calculados só a partir do que está guardado na app. Sem dados, cada
// função devolve zeros ou listas vazias e o ecrã mostra o estado vazio (nunca inventa).
import type { ClientProject } from "@/lib/projects/rules";

const lisbonDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" });

// Dia em Lisboa (AAAA-MM-DD) de uma data com hora.
export function lisbonDate(timestamp: string) {
  return lisbonDay.format(new Date(timestamp));
}

const cents = (value: number | string | null | undefined) => {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? Math.round(number * 100) : 0;
};

type MetricProject = Pick<ClientProject, "status" | "build_value" | "start_date" | "delivered_on" | "created_at">;

// Vendas do mês: criação dos projetos começados este mês (data de início; sem ela, a data
// de criação do registo). Os que ainda estão em "pedido" não contam como venda.
export function salesOfMonth(projects: MetricProject[], today: string) {
  const month = today.slice(0, 7);
  let total = 0;
  let count = 0;
  for (const project of projects) {
    if (project.status === "requested") continue;
    const started = project.start_date ?? lisbonDate(project.created_at);
    if (started.slice(0, 7) !== month) continue;
    total += cents(project.build_value);
    count += 1;
  }
  return { amount: total / 100, count };
}

// Entregues este mês, pela data de entrega feita.
export function deliveredThisMonth(projects: MetricProject[], today: string) {
  const month = today.slice(0, 7);
  const delivered = projects.filter((project) => project.delivered_on?.slice(0, 7) === month);
  return { count: delivered.length, amount: delivered.reduce((sum, project) => sum + cents(project.build_value), 0) / 100 };
}

export const FUNNEL_STAGES = ["contacted", "replied", "proposal", "won"] as const;
export type FunnelStage = (typeof FUNNEL_STAGES)[number];
export const FUNNEL_DAYS = 90;

// Funil dos últimos `days` dias, a partir do histórico de estados. Cada contacto conta na
// etapa mais avançada a que chegou e em todas as anteriores (quem passou logo a "respondeu"
// também foi contactado). "Perdido" e "por contactar" não entram.
export function funnel(events: { contact_id: string; status: string; created_at: string }[], today: string, days = FUNNEL_DAYS) {
  const since = new Date(`${today}T00:00:00Z`);
  since.setUTCDate(since.getUTCDate() - (days - 1));
  const from = since.toISOString().slice(0, 10);
  const reached = new Map<string, number>();
  for (const event of events) {
    const rank = FUNNEL_STAGES.indexOf(event.status as FunnelStage);
    if (rank < 0 || lisbonDate(event.created_at) < from) continue;
    reached.set(event.contact_id, Math.max(reached.get(event.contact_id) ?? -1, rank));
  }
  const ranks = [...reached.values()];
  return FUNNEL_STAGES.map((stage, index) => ({ stage, count: ranks.filter((rank) => rank >= index).length }));
}

export type ActivityItem = {
  kind: "contact" | "project";
  id: string;
  title: string;
  status: string;
  created: boolean;
  at: string;
};

// Atividade recente: as mudanças de estado dos contactos e a criação e as mudanças dos
// projetos, das mais recentes para as mais antigas. Sem nome conhecido, não entra.
export function recentActivity(
  contactEvents: { contact_id: string; status: string; created_at: string }[],
  projectEvents: { project_id: string; kind: string; status: string; created_at: string }[],
  contactNames: Map<string, string>,
  projectNames: Map<string, string>,
  limit = 8,
): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const event of contactEvents) {
    const title = contactNames.get(event.contact_id);
    if (title) items.push({ kind: "contact", id: event.contact_id, title, status: event.status, created: false, at: event.created_at });
  }
  for (const event of projectEvents) {
    const title = projectNames.get(event.project_id);
    if (title) items.push({ kind: "project", id: event.project_id, title, status: event.status, created: event.kind === "created", at: event.created_at });
  }
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

// Taxa de resposta dos últimos 90 dias: das empresas contactadas, quantas responderam.
export function responseRate(stages: { stage: FunnelStage; count: number }[]) {
  const contacted = stages.find((item) => item.stage === "contacted")?.count ?? 0;
  const replied = stages.find((item) => item.stage === "replied")?.count ?? 0;
  return { contacted, replied, percent: contacted > 0 ? Math.round((replied / contacted) * 100) : null };
}

export type UpcomingTask = {
  kind: "contact" | "project" | "billing";
  id: string;
  title: string;
  detail: string | null;
  date: string;
  overdue: boolean;
};

// Próximas tarefas: as próximas ações dos contactos e as entregas previstas dos projetos
// por entregar, por data (as atrasadas primeiro).
export function upcomingTasks(
  contacts: { id: string; label: string; next_action: string | null; next_action_at: string | null; status: string; do_not_contact?: boolean | null }[],
  projects: Pick<ClientProject, "id" | "company_name" | "name" | "status" | "due_date" | "delivered_on">[],
  today: string,
  limit = 5,
  // Cobranças (pagamentos previstos e manutenção do mês), já calculadas.
  billing: { projectId: string; company: string; detail: string; date: string; overdue: boolean }[] = [],
): UpcomingTask[] {
  const tasks: UpcomingTask[] = billing.map((item) => ({
    kind: "billing",
    id: item.projectId,
    title: item.company,
    detail: item.detail,
    date: item.date,
    overdue: item.overdue,
  }));
  for (const contact of contacts) {
    if (!contact.next_action_at || contact.do_not_contact || contact.status === "won" || contact.status === "lost") continue;
    tasks.push({
      kind: "contact",
      id: contact.id,
      title: contact.label,
      detail: contact.next_action,
      date: contact.next_action_at,
      overdue: contact.next_action_at < today,
    });
  }
  for (const project of projects) {
    if (!project.due_date || project.delivered_on || (project.status !== "requested" && project.status !== "in_progress")) continue;
    tasks.push({
      kind: "project",
      id: project.id,
      title: project.company_name,
      detail: project.name,
      date: project.due_date,
      overdue: project.due_date < today,
    });
  }
  return tasks.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)).slice(0, limit);
}
