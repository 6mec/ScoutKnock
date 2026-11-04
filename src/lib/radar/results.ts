import { whatsappNumber } from "@/lib/messages/rules";
import type { ScoredCompany } from "./search-events";
import type { ScoreLevel } from "./types";

// Filtros e ordenação dos resultados, só no ecrã: nada disto chama o Google outra vez
// nem guarda os dados da busca. Por isso não gastam busca.
export const RESULT_SORTS = ["score", "fewReviews", "name"] as const;
export type ResultSort = (typeof RESULT_SORTS)[number];

// O limiar das avaliações é o mesmo da nota ("Poucas avaliações, menos de 20").
export const FEW_REVIEWS = 20;

export const RESULT_FACETS = {
  level: ["all", "strong", "medium", "weak"],
  site: ["all", "none", "has"],
  contact: ["all", "mobile", "phone"],
  reviews: ["any", "few", "many"],
  saved: ["all", "notSaved"],
} as const;

export type ResultFacet = keyof typeof RESULT_FACETS;

export type ResultFilters = {
  level: "all" | ScoreLevel;
  site: (typeof RESULT_FACETS.site)[number];
  contact: (typeof RESULT_FACETS.contact)[number];
  reviews: (typeof RESULT_FACETS.reviews)[number];
  saved: (typeof RESULT_FACETS.saved)[number];
  sort: ResultSort;
};

export const DEFAULT_RESULT_FILTERS: ResultFilters = {
  level: "all",
  site: "all",
  contact: "all",
  reviews: "any",
  saved: "all",
  sort: "score",
};

// Os filtros escolhidos antes da busca, no formulário. Aplicam-se ao que chega.
export const PRE_FILTERS = ["noOwnSite", "mobile", "notSaved"] as const;
export type PreFilter = (typeof PRE_FILTERS)[number];

export function filtersFromPre(pre: readonly PreFilter[]): ResultFilters {
  return {
    ...DEFAULT_RESULT_FILTERS,
    site: pre.includes("noOwnSite") ? "none" : "all",
    contact: pre.includes("mobile") ? "mobile" : "all",
    saved: pre.includes("notSaved") ? "notSaved" : "all",
  };
}

export function activeFilterCount(filters: ResultFilters) {
  return (Object.keys(RESULT_FACETS) as ResultFacet[]).filter(
    (facet) => filters[facet] !== DEFAULT_RESULT_FILTERS[facet],
  ).length;
}

// Sem site, ou com um "site" que é uma rede social, uma página de ligações, de reservas
// ou um domínio estacionado.
export function hasNoOwnSite({ company }: ScoredCompany) {
  return company.website === null || Boolean(company.site.notOwn);
}

// Um telemóvel português ou um número com indicativo: dá para abrir no WhatsApp. Um fixo
// (começa por 2) pode não ter WhatsApp.
export function hasMobilePhone({ company }: ScoredCompany) {
  return whatsappNumber(company.phone) !== null;
}

export function isLikelyLandline(phone?: string | null) {
  return Boolean(phone?.trim()) && whatsappNumber(phone) === null;
}

export type PhoneKind = "mobile" | "landline" | "none";

export function phoneKind(phone?: string | null): PhoneKind {
  if (!phone?.trim()) return "none";
  return whatsappNumber(phone) === null ? "landline" : "mobile";
}

const collator = new Intl.Collator("pt-PT", { sensitivity: "base" });

function matches(item: ScoredCompany, filters: ResultFilters, savedIds: ReadonlySet<string>) {
  const { company, opportunity } = item;
  if (filters.level !== "all" && opportunity.level !== filters.level) return false;
  if (filters.site === "none" && !hasNoOwnSite(item)) return false;
  if (filters.site === "has" && hasNoOwnSite(item)) return false;
  if (filters.contact === "mobile" && !hasMobilePhone(item)) return false;
  if (filters.contact === "phone" && !company.phone?.trim()) return false;
  if (filters.reviews === "few" && (company.reviewCount === null || company.reviewCount >= FEW_REVIEWS)) return false;
  if (filters.reviews === "many" && (company.reviewCount === null || company.reviewCount < FEW_REVIEWS)) return false;
  if (filters.saved === "notSaved" && savedIds.has(company.id)) return false;
  return true;
}

export function applyResultFilters(
  results: ScoredCompany[],
  filters: ResultFilters,
  savedIds: ReadonlySet<string>,
) {
  const visible = results.filter((item) => matches(item, filters, savedIds));

  // A nota é a ordem que chega do servidor: as outras desempatam pela nota.
  if (filters.sort === "fewReviews") {
    return [...visible].sort(
      (a, b) =>
        // Sem dados de avaliações, vai para o fim.
        (a.company.reviewCount ?? Infinity) - (b.company.reviewCount ?? Infinity) ||
        b.opportunity.score - a.opportunity.score,
    );
  }
  if (filters.sort === "name") {
    return [...visible].sort((a, b) => collator.compare(a.company.name, b.company.name));
  }
  return visible;
}

// Contagens para a faixa de cima dos resultados, sobre tudo o que chegou.
export function resultStats(results: ScoredCompany[], savedIds: ReadonlySet<string>) {
  return {
    total: results.length,
    strong: results.filter(({ opportunity }) => opportunity.level === "strong").length,
    noOwnSite: results.filter(hasNoOwnSite).length,
    mobile: results.filter(hasMobilePhone).length,
    saved: results.filter(({ company }) => savedIds.has(company.id)).length,
  };
}

// Buscas recentes: só o que a pessoa escreveu (nicho e localidade), no próprio browser.
export const RECENT_SEARCHES_KEY = "scoutknock:radar:recentes";
export const MAX_RECENT_SEARCHES = 5;

export type RecentSearch = { niche: string; locality: string };

export function parseRecentSearches(raw: string | null): RecentSearch[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (item): item is RecentSearch =>
          typeof item === "object" &&
          item !== null &&
          typeof item.niche === "string" &&
          typeof item.locality === "string" &&
          item.niche.trim() !== "" &&
          item.locality.trim() !== "",
      )
      .map(({ niche, locality }) => ({
        niche: niche.trim().slice(0, 80),
        locality: locality.trim().slice(0, 80),
      }))
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

const sameSearch = (a: RecentSearch, b: RecentSearch) =>
  collator.compare(a.niche, b.niche) === 0 && collator.compare(a.locality, b.locality) === 0;

export function addRecentSearch(list: RecentSearch[], search: RecentSearch) {
  const entry = { niche: search.niche.trim(), locality: search.locality.trim() };
  if (!entry.niche || !entry.locality) return list;
  return [entry, ...list.filter((item) => !sameSearch(item, entry))].slice(
    0,
    MAX_RECENT_SEARCHES,
  );
}
