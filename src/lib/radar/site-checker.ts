import "server-only";
import { claimHost, parseSiteCheckConfig, reserveSiteChecks } from "./site-budget";
import type { SearchSiteChecker } from "./run-search";
import { checkSite } from "./site-check";

export function getSiteChecker({
  userId,
  kind,
  env = process.env,
}: {
  userId?: string;
  kind: "search" | "contact";
  env?: Record<string, string | undefined>;
}): SearchSiteChecker | null {
  const config = parseSiteCheckConfig(env);
  if (!config) return null;

  return {
    perSearch: config.perSearch,
    reserve: async (wanted) => {
      // Só aqui, para este ficheiro não exigir a chave secreta ao ser importado.
      const { createAdminClient } = await import("@/lib/supabase/admin");
      return reserveSiteChecks(createAdminClient(), config.dailyLimit, wanted, kind, userId);
    },
    check: async (website, signal) =>
      claimHost(website)
        ? checkSite(website, {
            userAgent: config.userAgent,
            excludedHosts: config.excludedHosts,
            signal,
          })
        : { status: "failed" },
  };
}
