import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DAILY_MESSAGE_LIMIT,
  messageCostEur,
  startOfLisbonDay,
  type MessageUsage,
} from "./rules";

const RESERVED_KIND = "message_reserved";

// Regista primeiro e conta depois: pedidos em simultâneo não passam o travão.
// Se a base de dados falhar, não há chamada paga.
export async function reserveMessage(
  db: SupabaseClient,
  userId: string,
  now = new Date(),
): Promise<"ok" | "limit" | "error"> {
  const { error } = await db.from("api_costs").insert({
    user_id: userId,
    provider: "claude",
    kind: RESERVED_KIND,
    units: 1,
    cost_eur: 0,
  });
  if (error) return "error";

  const { count, error: countError } = await db
    .from("api_costs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", RESERVED_KIND)
    .gte("created_at", startOfLisbonDay(now));
  if (countError || count === null) return "error";

  return count > DAILY_MESSAGE_LIMIT ? "limit" : "ok";
}

export async function recordMessageCost(
  db: SupabaseClient,
  userId: string,
  usage: MessageUsage,
) {
  const { error } = await db.from("api_costs").insert({
    user_id: userId,
    provider: "claude",
    kind: "message",
    units: usage.inputTokens + usage.outputTokens,
    cost_eur: messageCostEur(usage),
  });

  return error?.code;
}
