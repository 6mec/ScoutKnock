import "server-only";
import { parseSiteName } from "@/lib/demos/official-rules";
import { reportError } from "@/lib/events/log";
import { createClient } from "@/lib/supabase/server";
import type { PublicPortfolio } from "./rules";

// Só os portfólios publicados, pela função que devolve apenas os campos públicos.
export async function findPortfolio(value: string) {
  const slug = parseSiteName(value);
  if (!slug) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_portfolio", { portfolio_slug: slug });
  if (error) await reportError("portfolio publico", error.code);
  return (data as PublicPortfolio | null) ?? null;
}
