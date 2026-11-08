import "server-only";
import { reportError } from "@/lib/events/log";
import { siteUrl } from "@/lib/site";
import type { createClient } from "@/lib/supabase/server";
import { EMPTY_DEMO_LINKS, buildDemoLinks, type DemoLinks } from "./links";
import { activeDemoFilter } from "./rules";

// As demos ativas do utilizador, para o {link_demo} das mensagens. Sem a coluna
// "exemplo do nicho" (migração por aplicar), usa só as demos de cada empresa.
export async function loadDemoLinks(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<DemoLinks> {
  const query = (columns: string) =>
    supabase.from("demo_sites").select(columns).or(activeDemoFilter()).order("created_at", { ascending: false }).limit(500);
  let result = await query("slug, company_id, niche, niche_example");
  if (result.error) result = await query("slug, company_id, niche");
  if (result.error) {
    await reportError("demos links", result.error.code, userId);
    return EMPTY_DEMO_LINKS;
  }
  return buildDemoLinks((result.data ?? []) as unknown as Parameters<typeof buildDemoLinks>[0], siteUrl());
}
