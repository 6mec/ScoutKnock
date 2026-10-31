import type { SupabaseClient } from "@supabase/supabase-js";
import { startOfLisbonDay, startOfLisbonMonth } from "@/lib/lisbon-time";

export type GoogleCallKind = "text_search" | "place_details";
export type SpendResult = "ok" | "over" | "error";

export type GoogleConfig = {
  apiKey: string;
  dailyBudgetEur: number;
  monthlyBudgetEur: number;
  costEur: Record<GoogleCallKind, number>;
  maxPages: number;
};

const MAX_PAGES_ALLOWED = 3;
const PAGE_SIZE = 1000;

function amount(value: string | undefined) {
  if (!value?.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

// Sem tetos e custos válidos, o fornecedor real não arranca. Teto a 0 bloqueia tudo.
export function parseGoogleConfig(
  env: Record<string, string | undefined>,
): GoogleConfig | null {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  const dailyBudgetEur = amount(env.GOOGLE_DAILY_BUDGET_EUR);
  const monthlyBudgetEur = amount(env.GOOGLE_MONTHLY_BUDGET_EUR);
  const textSearch = amount(env.GOOGLE_TEXT_SEARCH_COST_EUR);
  const placeDetails = amount(env.GOOGLE_PLACE_DETAILS_COST_EUR);

  if (
    !apiKey ||
    dailyBudgetEur === null ||
    monthlyBudgetEur === null ||
    !textSearch ||
    !placeDetails
  ) {
    return null;
  }

  const pages = Math.floor(Number(env.GOOGLE_MAX_PAGES_PER_SEARCH ?? 1));

  return {
    apiKey,
    dailyBudgetEur,
    monthlyBudgetEur,
    costEur: { text_search: textSearch, place_details: placeDetails },
    maxPages: pages >= 1 ? Math.min(pages, MAX_PAGES_ALLOWED) : 1,
  };
}

// O Supabase devolve no máximo mil linhas de cada vez: sem páginas, o total
// ficaria curto e o travão deixaria passar gastos a mais.
async function spentSoFar(db: SupabaseClient, now: Date) {
  const dayStart = new Date(startOfLisbonDay(now)).getTime();
  let day = 0;
  let month = 0;

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from("api_costs")
      .select("created_at, cost_eur")
      .eq("provider", "google_places")
      .gte("created_at", startOfLisbonMonth(now))
      .order("id")
      .range(from, from + PAGE_SIZE - 1);

    if (error || !data) return null;

    for (const row of data) {
      const cost = Number(row.cost_eur);
      month += cost;
      if (new Date(row.created_at).getTime() >= dayStart) day += cost;
    }

    if (data.length < PAGE_SIZE) return { day, month };
  }
}

// Conta e regista antes da chamada. O teto é do projeto inteiro. A segunda
// contagem apanha pedidos em simultâneo; se a base de dados falhar, não há chamada.
export async function spendGoogleCall(
  db: SupabaseClient,
  config: GoogleConfig,
  kind: GoogleCallKind,
  userId?: string,
  now = new Date(),
): Promise<SpendResult> {
  const cost = config.costEur[kind];
  const before = await spentSoFar(db, now);
  if (!before) return "error";
  if (
    before.day + cost > config.dailyBudgetEur ||
    before.month + cost > config.monthlyBudgetEur
  ) {
    return "over";
  }

  const { error } = await db.from("api_costs").insert({
    user_id: userId ?? null,
    provider: "google_places",
    kind,
    units: 1,
    cost_eur: cost,
  });
  if (error) return "error";

  const after = await spentSoFar(db, now);
  if (!after) return "error";

  return after.day > config.dailyBudgetEur ||
    after.month > config.monthlyBudgetEur
    ? "over"
    : "ok";
}
