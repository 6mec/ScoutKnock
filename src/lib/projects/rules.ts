// Projetos por cliente: o trabalho definitivo para uma empresa. Guarda só o que o
// Daniel escreve (estado, valores em euros, datas e notas). Não cobra, não emite
// faturas e não calcula impostos: as somas são só dos valores escritos.
import { parseDealValue } from "@/lib/contacts/rules";

export const PROJECT_KINDS = ["site", "site_booking", "app", "other"] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];
export const PROJECT_STATUSES = ["requested", "in_progress", "delivered", "maintenance", "finished"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const MAX_PROJECT_NAME = 120;
export const MAX_PROJECT_COMPANY = 120;
export const MAX_THIRD_PARTY_NOTE = 300;
export const MAX_PROJECT_LINK = 300;
export const MAX_PROJECT_NOTES = 4000;

export type ClientProject = {
  id: string;
  contact_id: string | null;
  work_request_id: string | null;
  company_name: string;
  name: string;
  kind: ProjectKind;
  status: ProjectStatus;
  build_value: number | string | null;
  third_party_value: number | string | null;
  third_party_note: string | null;
  maintenance_monthly: number | string | null;
  start_date: string | null;
  due_date: string | null;
  delivered_on: string | null;
  maintenance_since: string | null;
  link: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  portfolio_show?: boolean;
  portfolio_summary?: string | null;
  portfolio_url?: string | null;
  portfolio_image?: string | null;
};

export type ProjectEvent = {
  project_id: string;
  kind: "created" | "status";
  status: ProjectStatus;
  created_at: string;
};

export const PROJECT_COLUMNS =
  "id, contact_id, work_request_id, company_name, name, kind, status, build_value, third_party_value, third_party_note, maintenance_monthly, start_date, due_date, delivered_on, maintenance_since, link, notes, created_at, updated_at, portfolio_show, portfolio_summary, portfolio_url, portfolio_image";

export type ProjectFields = {
  companyName: string;
  name: string;
  kind: ProjectKind;
  status: ProjectStatus;
  buildValue: number | null;
  thirdPartyValue: number | null;
  thirdPartyNote: string | null;
  maintenanceMonthly: number | null;
  startDate: string | null;
  dueDate: string | null;
  deliveredOn: string | null;
  maintenanceSince: string | null;
  link: string | null;
  notes: string | null;
};

export type ProjectInput = ProjectFields & { contactId: string | null; workRequestId: string | null };

export type ProjectError =
  | "required"
  | "value"
  | "date"
  | "dueBeforeStart"
  | "deliveredBeforeStart"
  | "secret"
  | "tooLong";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function optionalId(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "string" && UUID.test(value) ? value : undefined;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

// Vazio é null; inválido é undefined.
function optionalDate(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "string" && isValidDate(value) ? value : undefined;
}

function optionalText(value: unknown, max: number) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (text.length > max) return undefined;
  return text || null;
}

// Palavras-passe e chaves de acesso do cliente não se guardam aqui. Apanha as formas
// mais comuns ("senha: …", "password=…") e chaves com prefixo conhecido.
const SECRET_PATTERNS = [
  /\b(senha|palavra[- ]?passe|password|passwd|pwd|pass|pin|token|api[ _-]?key|chave( de acesso| da api)?)\s*[:=]\s*\S/i,
  /\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{8,}/,
  /\bsk-[A-Za-z0-9-]{16,}/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./,
  /:\/\/[^\s/:@]+:[^\s/@]+@/,
];

export function looksLikeSecret(text: string | null) {
  return Boolean(text) && SECRET_PATTERNS.some((pattern) => pattern.test(text as string));
}

export function parseProjectFields(value: unknown): { ok: true; fields: ProjectFields } | { ok: false; error: ProjectError } {
  if (typeof value !== "object" || value === null) return { ok: false, error: "required" };
  const raw = value as Record<string, unknown>;

  const companyName = typeof raw.companyName === "string" ? raw.companyName.trim() : "";
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const kind = PROJECT_KINDS.find((item) => item === raw.kind);
  const status = PROJECT_STATUSES.find((item) => item === raw.status);
  if (!companyName || !name || !kind || !status) return { ok: false, error: "required" };
  if (companyName.length > MAX_PROJECT_COMPANY || name.length > MAX_PROJECT_NAME) {
    return { ok: false, error: "tooLong" };
  }

  const buildValue = parseDealValue(raw.buildValue ?? null);
  const thirdPartyValue = parseDealValue(raw.thirdPartyValue ?? null);
  const maintenanceMonthly = parseDealValue(raw.maintenanceMonthly ?? null);
  if (buildValue === undefined || thirdPartyValue === undefined || maintenanceMonthly === undefined) {
    return { ok: false, error: "value" };
  }

  const startDate = optionalDate(raw.startDate);
  const dueDate = optionalDate(raw.dueDate);
  const deliveredOn = optionalDate(raw.deliveredOn);
  const maintenanceSince = optionalDate(raw.maintenanceSince);
  if (startDate === undefined || dueDate === undefined || deliveredOn === undefined || maintenanceSince === undefined) {
    return { ok: false, error: "date" };
  }
  if (startDate && dueDate && dueDate < startDate) return { ok: false, error: "dueBeforeStart" };
  if (startDate && deliveredOn && deliveredOn < startDate) return { ok: false, error: "deliveredBeforeStart" };

  const thirdPartyNote = optionalText(raw.thirdPartyNote, MAX_THIRD_PARTY_NOTE);
  const link = optionalText(raw.link, MAX_PROJECT_LINK);
  const notes = optionalText(raw.notes, MAX_PROJECT_NOTES);
  if (thirdPartyNote === undefined || link === undefined || notes === undefined) {
    return { ok: false, error: "tooLong" };
  }
  if ([thirdPartyNote, link, notes, name].some(looksLikeSecret)) return { ok: false, error: "secret" };

  return {
    ok: true,
    fields: {
      companyName,
      name,
      kind,
      status,
      buildValue,
      thirdPartyValue,
      thirdPartyNote,
      maintenanceMonthly,
      startDate,
      dueDate,
      deliveredOn,
      maintenanceSince,
      link,
      notes,
    },
  };
}

export function parseProjectInput(value: unknown): { ok: true; input: ProjectInput } | { ok: false; error: ProjectError } {
  const parsed = parseProjectFields(value);
  if (!parsed.ok) return parsed;
  const raw = value as Record<string, unknown>;
  const contactId = optionalId(raw.contactId);
  const workRequestId = optionalId(raw.workRequestId);
  if (contactId === undefined || workRequestId === undefined) return { ok: false, error: "required" };
  return { ok: true, input: { ...parsed.fields, contactId, workRequestId } };
}

export function toRow(fields: ProjectFields) {
  return {
    company_name: fields.companyName,
    name: fields.name,
    kind: fields.kind,
    status: fields.status,
    build_value: fields.buildValue,
    third_party_value: fields.thirdPartyValue,
    third_party_note: fields.thirdPartyNote,
    maintenance_monthly: fields.maintenanceMonthly,
    start_date: fields.startDate,
    due_date: fields.dueDate,
    delivered_on: fields.deliveredOn,
    maintenance_since: fields.maintenanceSince,
    link: fields.link,
    notes: fields.notes,
  };
}

// Um pedido de trabalho passa a projeto com o mesmo tipo.
export function kindFromRequest(kind: string): ProjectKind {
  return PROJECT_KINDS.find((item) => item === kind) ?? "other";
}

export function amount(value: number | string | null) {
  if (value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

// Atrasado: ainda por entregar e a data prevista já passou (dia de Lisboa).
export function isLate(project: Pick<ClientProject, "status" | "due_date" | "delivered_on">, today: string) {
  return (
    (project.status === "requested" || project.status === "in_progress") &&
    !project.delivered_on &&
    Boolean(project.due_date) &&
    (project.due_date as string) < today
  );
}

// A data que interessa agora: a entrega prevista enquanto se trabalha, a entrega feita
// depois, e o início da manutenção quando está em manutenção.
export function nextDate(project: Pick<ClientProject, "status" | "start_date" | "due_date" | "delivered_on" | "maintenance_since">) {
  switch (project.status) {
    case "requested":
    case "in_progress":
      return project.due_date ? { kind: "due" as const, date: project.due_date } : null;
    case "delivered":
    case "finished":
      return project.delivered_on ? { kind: "delivered" as const, date: project.delivered_on } : null;
    case "maintenance":
      return project.maintenance_since
        ? { kind: "maintenance" as const, date: project.maintenance_since }
        : null;
  }
}

// Somas só dos valores escritos: criação dos projetos com data de entrega e manutenção
// mensal dos que estão em manutenção. Não é faturação nem rendimento.
export function projectTotals(projects: ClientProject[]) {
  let build = 0;
  let buildCount = 0;
  let maintenance = 0;
  let maintenanceCount = 0;
  for (const project of projects) {
    const buildValue = amount(project.build_value);
    if (project.delivered_on && buildValue !== null) {
      build += buildValue;
      buildCount += 1;
    }
    const monthly = amount(project.maintenance_monthly);
    if (project.status === "maintenance" && monthly !== null) {
      maintenance += monthly;
      maintenanceCount += 1;
    }
  }
  return {
    build: Math.round(build * 100) / 100,
    buildCount,
    maintenance: Math.round(maintenance * 100) / 100,
    maintenanceCount,
  };
}

const STATUS_ORDER: Record<ProjectStatus, number> = {
  in_progress: 0,
  requested: 1,
  delivered: 2,
  maintenance: 3,
  finished: 4,
};

// Em curso e por começar primeiro; atrasados à frente; depois os mais recentes.
export function sortProjects(projects: ClientProject[], today: string) {
  return [...projects].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      Number(isLate(b, today)) - Number(isLate(a, today)) ||
      (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") ||
      b.created_at.localeCompare(a.created_at),
  );
}

function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function filterProjects(projects: ClientProject[], status: ProjectStatus | "all", search: string) {
  const query = normalize(search.trim());
  return projects.filter(
    (project) =>
      (status === "all" || project.status === status) &&
      (!query || normalize(`${project.company_name} ${project.name}`).includes(query)),
  );
}

// Só um endereço http(s) abre como ligação; o resto (por exemplo, a pasta do projeto)
// mostra-se como texto.
export function safeProjectUrl(link: string | null) {
  if (!link) return null;
  try {
    const parsed = new URL(link);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

// Valor para o campo do formulário: "1200,5" em vez de "1200.50".
export function valueForInput(value: number | string | null) {
  const number = amount(value);
  return number === null ? "" : String(number).replace(".", ",");
}

// Resumo para o Início: o que está por entregar, o que está atrasado, as próximas três
// entregas e a manutenção mensal em curso (só valores escritos).
export type ProjectSummaryRow = Pick<
  ClientProject,
  "id" | "company_name" | "name" | "status" | "due_date" | "delivered_on" | "maintenance_monthly" | "build_value" | "created_at"
>;

export function projectsSummary(projects: ProjectSummaryRow[], today: string) {
  const open = projects.filter((project) => project.status === "requested" || project.status === "in_progress");
  const late = open
    .filter((project) => isLate(project, today))
    .sort((a, b) => (a.due_date as string).localeCompare(b.due_date as string));
  const upcoming = open
    .filter((project) => project.due_date && !project.delivered_on && !isLate(project, today))
    .sort((a, b) => (a.due_date as string).localeCompare(b.due_date as string))
    .slice(0, 3);
  const totals = projectTotals(projects as ClientProject[]);
  return {
    total: projects.length,
    open: open.length,
    late,
    upcoming,
    maintenance: totals.maintenance,
    maintenanceCount: totals.maintenanceCount,
  };
}
