import { ptPT } from "@/i18n/pt-PT";
import type { Company, Opportunity, ReasonCode, ServiceId } from "@/lib/radar/types";

const { outreach: copy } = ptPT;

// ---------- Nota do site ----------

export type SiteGrade =
  | { kind: "none" }
  | { kind: "notOwn" }
  | { kind: "unchecked" }
  | { kind: "graded"; grade: "A" | "B" | "C" | "D"; bad: number; total: number };

const GRADES = ["A", "B", "C", "D"] as const;

// Só conta o que a verificação observou. Um sinal por verificar (null) não entra.
export function siteGrade(company: Company): SiteGrade {
  if (company.website === null) return { kind: "none" };
  if (company.site.notOwn) return { kind: "notOwn" };

  const checks = [
    company.site.isSlow === null ? null : company.site.isSlow,
    company.site.isMobileFriendly === null ? null : !company.site.isMobileFriendly,
    company.site.isOutdated === null ? null : company.site.isOutdated,
  ].filter((value): value is boolean => value !== null);

  if (checks.length === 0) return { kind: "unchecked" };

  const bad = checks.filter(Boolean).length;
  return { kind: "graded", grade: GRADES[Math.min(bad, 3)], bad, total: checks.length };
}

export function siteGradeLabel(grade: SiteGrade) {
  if (grade.kind === "graded") return grade.grade;
  return copy.siteGrade[grade.kind];
}

// ---------- Guião de chamada ----------

export type CallScript = {
  opening: string;
  why: string[];
  questions: readonly string[];
  objections: readonly { they: string; you: string }[];
  next: string;
  voicemail: string;
};

export function buildCallScript({
  companyName,
  niche,
  reasons,
  senderName,
  service = "website_creation",
}: {
  companyName: string;
  niche: string;
  reasons: ReasonCode[];
  senderName: string | null;
  service?: ServiceId;
}): CallScript {
  const sender = senderName?.trim() || null;
  // No máximo duas observações: numa chamada, mais do que isso soa a lista.
  const why = reasons.slice(0, 2).map((code) => copy.call.why[code](companyName));

  return {
    opening: copy.call.opening(companyName, sender, niche, ptPT.radar.servicePitch[service]),
    why: why.length > 0 ? why : [copy.call.noReasons],
    questions: copy.call.questions,
    objections: copy.call.objections,
    next: copy.call.next(companyName, service === "online_booking"),
    voicemail: copy.call.voicemail(companyName, sender),
  };
}

export function callScriptText(title: string, script: CallScript) {
  const s = copy.call.sections;
  return [
    title,
    "",
    `${s.opening}: ${script.opening}`,
    "",
    `${s.why}:`,
    ...script.why.map((line) => `- ${line}`),
    "",
    `${s.questions}:`,
    ...script.questions.map((line) => `- ${line}`),
    "",
    `${s.objections}`,
    ...script.objections.map(({ they, you }) => `- "${they}" → ${you}`),
    "",
    `${s.next}: ${script.next}`,
    "",
    `${s.voicemail}: ${script.voicemail}`,
  ].join("\n");
}

// ---------- Diagnóstico para a empresa ----------

export type DiagnosisItem = {
  code: ReasonCode;
  meaning: string;
  suggestion: string;
};

// Só os motivos encontrados na busca, pela ordem da nota. Nada é acrescentado.
export function diagnosisItems(opportunity: Opportunity): DiagnosisItem[] {
  return opportunity.reasons.map(({ code }) => ({
    code,
    meaning: copy.diagnosis.items[code].meaning,
    suggestion: copy.diagnosis.items[code].suggestion,
  }));
}

// ---------- Planeador do mês ----------

export const PLANNER_KEY = "scoutknock:planeador";
// Abaixo disto, a taxa dos contactos ainda não diz nada e pede-se uma estimativa.
export const MIN_DECIDED_FOR_RATE = 5;
const WORKING_DAYS_PER_MONTH = 21;

export type PlannerInput = { goal: number | null; price: number | null; ratePercent: number | null };

export function closeRate(statuses: string[]) {
  const won = statuses.filter((status) => status === "won").length;
  const lost = statuses.filter((status) => status === "lost").length;
  const decided = won + lost;
  return decided >= MIN_DECIDED_FOR_RATE
    ? { won, decided, percent: Math.round((won / decided) * 100) }
    : null;
}

export function averageWonValue(rows: { status: string; deal_value: number | null }[]) {
  const values = rows
    .filter((row) => row.status === "won" && row.deal_value !== null && row.deal_value > 0)
    .map((row) => Number(row.deal_value));
  return values.length > 0
    ? Math.round(values.reduce((total, value) => total + value, 0) / values.length)
    : null;
}

export function planMonth({ goal, price, ratePercent }: PlannerInput) {
  if (!goal || !price || goal <= 0 || price <= 0) return null;
  const sales = Math.ceil(goal / price);
  if (!ratePercent || ratePercent <= 0 || ratePercent > 100) return { sales, contacts: null, perDay: null };
  const contacts = Math.ceil(sales / (ratePercent / 100));
  return { sales, contacts, perDay: Math.ceil(contacts / WORKING_DAYS_PER_MONTH) };
}

export function parsePlannerInput(raw: string | null): PlannerInput {
  const empty = { goal: null, price: null, ratePercent: null };
  if (!raw) return empty;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    const num = (v: unknown, max: number) =>
      typeof v === "number" && Number.isFinite(v) && v > 0 && v <= max ? v : null;
    return {
      goal: num(value.goal, 1_000_000),
      price: num(value.price, 1_000_000),
      ratePercent: num(value.ratePercent, 100),
    };
  } catch {
    return empty;
  }
}
