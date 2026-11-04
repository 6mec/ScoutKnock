import { PLANS } from "@/lib/account/rules";
import { isPaymentProblem } from "@/lib/billing/rules";
import { CONTACT_STATUSES, type ContactStatus } from "@/lib/contacts/rules";
import { SERVICE_IDS, type SearchQuery } from "@/lib/radar/types";

export const DEMO_WARNING_DAYS = 7;
const DAY_MS = 86_400_000;

export type DashboardData = {
  subscription: {
    status: string | null;
    plan: string | null;
    trial_end: string | null;
    trial_used: boolean;
    cancel_at_period_end: boolean;
    has_customer: boolean;
  };
  usage: {
    period_end: string;
    searches_used: number;
    searches_limit: number;
    demos_used: number;
    demos_limit: number;
    lookups_used: number;
    lookups_limit: number;
    lookups_today: number;
    lookups_daily_limit: number;
  };
  leads: Partial<Record<ContactStatus, number>>;
  searches: {
    service: string;
    niche: string;
    locality: string;
    count: number;
    created_at: string;
  }[];
  demos: {
    active: number;
    items: { id: string; company_name: string | null; expires_at: string }[];
  };
};

export type MeterKey = "searches" | "demos" | "lookups";

export function usageMeters({ usage }: Pick<DashboardData, "usage">) {
  const meters: { key: MeterKey; used: number; limit: number }[] = [
    { key: "searches", used: usage.searches_used, limit: usage.searches_limit },
    { key: "demos", used: usage.demos_used, limit: usage.demos_limit },
    { key: "lookups", used: usage.lookups_used, limit: usage.lookups_limit },
  ];

  return meters.map((meter) => ({
    ...meter,
    reached: meter.used >= meter.limit,
    percent: meter.limit > 0 ? Math.min(100, Math.round((meter.used / meter.limit) * 100)) : 100,
  }));
}

// Arredonda para cima: quem tem 6 dias e 1 hora ainda tem 7 dias para decidir.
export function daysUntil(date: string, now: number) {
  return Math.max(0, Math.ceil((new Date(date).getTime() - now) / DAY_MS));
}

export function totalLeads(leads: DashboardData["leads"]) {
  return CONTACT_STATUSES.reduce((total, status) => total + (leads[status] ?? 0), 0);
}

export function hasActivePlan({ subscription }: Pick<DashboardData, "subscription">) {
  return subscription.status === "active" && Boolean(subscription.plan);
}

export type NextStep =
  | { kind: "paymentProblem" }
  | { kind: "limitSubscribe" }
  | { kind: "limitUpgrade" }
  | { kind: "limitWait" }
  | { kind: "expiringDemo"; id: string; name: string | null; days: number }
  | { kind: "toContact"; count: number }
  | { kind: "lateProject"; name: string; count: number }
  | { kind: "firstSearch" }
  | { kind: "saveCompany" }
  | { kind: "newSearch" };

// Uma só sugestão: a primeira regra que se aplica, da mais urgente para a menos.
// No modo pessoal (`selling` a false) não há packs nem demos a avisar: um projeto
// atrasado passa à frente de tudo.
export function nextStep(
  data: DashboardData,
  now: number,
  {
    selling = true,
    lateProjects = [],
  }: { selling?: boolean; lateProjects?: { company_name: string }[] } = {},
): NextStep {
  const { subscription, usage, demos, leads, searches } = data;

  if (lateProjects.length > 0) {
    return { kind: "lateProject", name: lateProjects[0].company_name, count: lateProjects.length };
  }

  if (!selling) {
    if (leads.to_contact) return { kind: "toContact", count: leads.to_contact };
    if (searches.length === 0) return { kind: "firstSearch" };
    if (totalLeads(leads) === 0) return { kind: "saveCompany" };
    return { kind: "newSearch" };
  }

  if (isPaymentProblem(subscription.status)) return { kind: "paymentProblem" };

  if (usage.searches_used >= usage.searches_limit) {
    if (!hasActivePlan(data)) return { kind: "limitSubscribe" };
    // O último pack da lista é o maior: nesse, só resta esperar.
    return subscription.plan === PLANS[PLANS.length - 1].id
      ? { kind: "limitWait" }
      : { kind: "limitUpgrade" };
  }

  const soonest = demos.items[0];
  if (soonest) {
    const days = daysUntil(soonest.expires_at, now);
    if (days <= DEMO_WARNING_DAYS) {
      return { kind: "expiringDemo", id: soonest.id, name: soonest.company_name, days };
    }
  }

  if (leads.to_contact) return { kind: "toContact", count: leads.to_contact };
  if (searches.length === 0) return { kind: "firstSearch" };
  if (totalLeads(leads) === 0) return { kind: "saveCompany" };

  return { kind: "newSearch" };
}

export function repeatQuery(search: DashboardData["searches"][number]): SearchQuery {
  return {
    service: SERVICE_IDS.find((id) => id === search.service) ?? SERVICE_IDS[0],
    niche: search.niche,
    locality: search.locality,
  };
}

export function parseStatusFilter(value: unknown): ContactStatus | null {
  return CONTACT_STATUSES.find((status) => status === value) ?? null;
}
