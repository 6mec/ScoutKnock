import { parseSiteUrl } from "@/lib/site";
import type { SupabaseClient } from "@supabase/supabase-js";
import { startOfLisbonDay } from "@/lib/lisbon-time";

const DEFAULT_PER_SEARCH = 8;
const PAGE_SIZE = 1000;
const HOST_COOLDOWN_MS = 60_000;
const MAX_REMEMBERED_HOSTS = 5000;

export type SiteCheckConfig = {
  perSearch: number;
  dailyLimit: number;
  userAgent: string;
  excludedHosts: string[];
};

export function parseBotContact(env: Record<string, string | undefined>) {
  const name = env.BOT_CONTACT_NAME?.trim();
  const email = env.BOT_CONTACT_EMAIL?.trim();

  return name && email?.includes("@") ? { name, email } : null;
}

// Sem interruptor, teto, página pública do robô ou contacto nessa página, não há
// verificações. A busca segue igual.
export function parseSiteCheckConfig(
  env: Record<string, string | undefined>,
): SiteCheckConfig | null {
  if (env.SITE_CHECKS_ENABLED !== "true" || !parseBotContact(env)) return null;

  const dailyLimit = Number(env.SITE_CHECKS_DAILY_LIMIT);
  if (!env.SITE_CHECKS_DAILY_LIMIT?.trim() || !Number.isInteger(dailyLimit) || dailyLimit <= 0) {
    return null;
  }

  let site: URL;
  try {
    site = new URL(parseSiteUrl(env.SITE_URL) ?? "");
  } catch {
    return null;
  }
  if (env.NODE_ENV === "production" && site.protocol !== "https:") return null;

  const perSearch = Math.floor(Number(env.SITE_CHECKS_PER_SEARCH ?? DEFAULT_PER_SEARCH));

  return {
    perSearch:
      perSearch >= 1 ? Math.min(perSearch, DEFAULT_PER_SEARCH) : DEFAULT_PER_SEARCH,
    dailyLimit,
    userAgent: `ScoutKnockBot/1.0 (+${new URL("/bot", site).href})`,
    excludedHosts: (env.SITE_CHECKS_EXCLUDED_HOSTS ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  };
}

async function usedToday(db: SupabaseClient, now: Date) {
  let total = 0;
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from("api_costs")
      .select("units")
      .eq("provider", "site_check")
      .gte("created_at", startOfLisbonDay(now))
      .order("id")
      .range(from, from + PAGE_SIZE - 1);

    if (error || !data) return null;
    for (const row of data) total += Number(row.units);
    if (data.length < PAGE_SIZE) return total;
  }
}

// Conta antes de visitar, como nas chamadas pagas. Se a base de dados falhar, não visita.
export async function reserveSiteChecks(
  db: SupabaseClient,
  dailyLimit: number,
  wanted: number,
  kind: "search" | "contact",
  userId?: string,
  now = new Date(),
) {
  const before = await usedToday(db, now);
  if (before === null) return 0;

  const units = Math.min(wanted, dailyLimit - before);
  if (units <= 0) return 0;

  const { error } = await db.from("api_costs").insert({
    user_id: userId ?? null,
    provider: "site_check",
    kind,
    units,
    cost_eur: 0,
  });
  if (error) return 0;

  const after = await usedToday(db, now);
  if (after === null) return 0;

  return Math.max(0, Math.min(units, dailyLimit - (after - units)));
}

// Nunca dois pedidos seguidos ao mesmo site. Fica na memória desta instância do
// servidor e guarda só o nome e a hora, por pouco tempo.
const lastVisit = new Map<string, number>();

export function claimHost(website: string, now = Date.now()) {
  let host: string;
  try {
    host = new URL(website).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return false;
  }

  const last = lastVisit.get(host);
  if (last !== undefined && now - last < HOST_COOLDOWN_MS) return false;

  if (lastVisit.size >= MAX_REMEMBERED_HOSTS) {
    for (const [name, time] of lastVisit) {
      if (now - time >= HOST_COOLDOWN_MS) lastVisit.delete(name);
    }
    if (lastVisit.size >= MAX_REMEMBERED_HOSTS) return false;
  }

  lastVisit.set(host, now);
  return true;
}
