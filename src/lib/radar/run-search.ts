import { GoogleBudgetError } from "./google-provider";
import { OverpassError } from "./overpass-client";
import type { CompanyProvider } from "./provider";
import { scoreCompany } from "./score";
import type { SearchEvent } from "./search-events";
import type { SiteCheckResult } from "./site-check";
import { thirdPartyKind } from "./site-rules";
import type { Company, SearchQuery } from "./types";

const SITE_CONCURRENCY = 3;
// Tem de caber, com a busca, no tempo de uma função da Netlify.
export const SITES_TOTAL_MS = 15_000;

// Definido aqui sem importar o servidor, para os testes poderem usar sites simulados.
export type SearchSiteChecker = {
  perSearch: number;
  reserve: (wanted: number) => Promise<number>;
  check: (website: string, signal: AbortSignal) => Promise<SiteCheckResult>;
};

async function* checkSites(
  checker: SearchSiteChecker,
  companies: Company[],
  query: SearchQuery,
  signal?: AbortSignal,
  totalMs = SITES_TOTAL_MS,
): AsyncGenerator<SearchEvent> {
  const candidates = companies.filter(
    (company) => company.website && !thirdPartyKind(company.website),
  );
  if (candidates.length === 0) return;

  let allowed = 0;
  try {
    allowed = await checker.reserve(Math.min(candidates.length, checker.perSearch));
  } catch {
    allowed = 0;
  }
  const targets = candidates.slice(0, allowed);
  const skipped = candidates.slice(allowed).map((company) => company.id);
  yield {
    type: "sites_start",
    checking: targets.map((company) => company.id),
    skipped,
  };

  const deadline = AbortSignal.timeout(totalMs);
  const stop = signal ? AbortSignal.any([signal, deadline]) : deadline;
  const finished: { company: Company; result: SiteCheckResult }[] = [];
  let wake = () => {};
  let next = 0;

  async function worker() {
    while (next < targets.length) {
      const company = targets[next];
      next += 1;
      const result = stop.aborted
        ? ({ status: "failed" } as const)
        : await checker
            .check(company.website!, stop)
            .catch(() => ({ status: "failed" }) as const);
      finished.push({ company, result });
      wake();
    }
  }
  void Promise.all(Array.from({ length: SITE_CONCURRENCY }, worker));

  let checked = 0;
  let failed = 0;
  for (let handled = 0; handled < targets.length; ) {
    if (finished.length === 0) {
      await new Promise<void>((resolve) => {
        wake = resolve;
        if (finished.length > 0) resolve();
      });
    }

    const item = finished.shift();
    if (!item) continue;
    handled += 1;
    if (signal?.aborted) return;

    if (item.result.status === "checked") {
      checked += 1;
      const { site } = item.result;
      yield {
        type: "site",
        id: item.company.id,
        status: "checked",
        site,
        opportunity: scoreCompany({ ...item.company, site }, query.service),
      };
    } else {
      failed += 1;
      yield { type: "site", id: item.company.id, status: "failed" };
    }
  }

  yield { type: "sites_done", checked, failed, skipped: skipped.length };
}

// Cada evento corresponde a trabalho já feito: o registo do ecrã nunca se adianta.
export async function* runSearch(
  provider: CompanyProvider,
  query: SearchQuery,
  signal?: AbortSignal,
  sites?: SearchSiteChecker | null,
): AsyncGenerator<SearchEvent> {
  // Os dados de exemplo são fictícios: não há nada para visitar.
  yield* scoreCompanies(provider.stream(query, signal), query, {
    signal,
    sites: provider.usesSampleData ? null : sites,
  });
}

// A nota e a verificação dos sites, para empresas vindas do fornecedor ou, no caso do
// OpenStreetMap, da busca feita no browser e já validada pelo servidor.
export async function* scoreCompanies(
  source: AsyncIterable<Company> | Iterable<Company>,
  query: SearchQuery,
  { signal, sites }: { signal?: AbortSignal; sites?: SearchSiteChecker | null } = {},
): AsyncGenerator<SearchEvent> {
  const companies: Company[] = [];

  yield { type: "step", step: "reading", status: "active" };

  try {
    for await (const company of source) {
      if (signal?.aborted) return;
      if (companies.length === 0) {
        yield { type: "step", step: "scoring", status: "active" };
      }

      yield {
        type: "company",
        company,
        opportunity: scoreCompany(company, query.service),
      };
      companies.push(company);
    }
  } catch (error) {
    if (signal?.aborted) return;
    console.error(`radar: ${error instanceof Error ? error.message || error.name : "erro"}`);
    yield {
      type: "error",
      code:
        error instanceof GoogleBudgetError
          ? "budget"
          : error instanceof OverpassError && error.code === "timeout"
            ? "timeout"
            : error instanceof OverpassError || (error instanceof Error && error.name === "TimeoutError")
            ? "busy"
            : "provider",
    };
    return;
  }

  yield { type: "step", step: "reading", status: "done" };
  yield { type: "step", step: "scoring", status: "done" };
  yield { type: "done", count: companies.length };

  if (sites) {
    yield* checkSites(sites, companies, query, signal);
  }
}
