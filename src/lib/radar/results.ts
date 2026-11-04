import { whatsappNumber } from "@/lib/messages/rules";
import type { ScoredCompany } from "./search-events";
import type { ScoreLevel } from "./types";

// Filtros e ordenação dos resultados, só no ecrã: nada disto chama o Google outra vez
// nem guarda os dados da busca.
export const RESULT_SORTS = ["score", "fewReviews", "name"] as const;
export type ResultSort = (typeof RESULT_SORTS)[number];

export const RESULT_TOGGLES = ["noOwnSite", "mobile", "notSaved"] as const;
export type ResultToggle = (typeof RESULT_TOGGLES)[number];

export type ResultFilters = {
  level: "all" | ScoreLevel;
  toggles: ResultToggle[];
  sort: ResultSort;
};

export const DEFAULT_RESULT_FILTERS: ResultFilters = {
  level: "all",
  toggles: [],
  sort: "score",
};

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

const collator = new Intl.Collator("pt-PT", { sensitivity: "base" });

export function applyResultFilters(
  results: ScoredCompany[],
  filters: ResultFilters,
  savedIds: ReadonlySet<string>,
) {
  const visible = results.filter((item) => {
    if (filters.level !== "all" && item.opportunity.level !== filters.level) return false;
    if (filters.toggles.includes("noOwnSite") && !hasNoOwnSite(item)) return false;
    if (filters.toggles.includes("mobile") && !hasMobilePhone(item)) return false;
    if (filters.toggles.includes("notSaved") && savedIds.has(item.company.id)) return false;
    return true;
  });

  // A nota é a ordem que chega do servidor: as outras desempatam pela nota.
  if (filters.sort === "fewReviews") {
    return [...visible].sort(
      (a, b) =>
        a.company.reviewCount - b.company.reviewCount ||
        b.opportunity.score - a.opportunity.score,
    );
  }
  if (filters.sort === "name") {
    return [...visible].sort((a, b) => collator.compare(a.company.name, b.company.name));
  }
  return visible;
}

export function toggleFilter(toggles: ResultToggle[], toggle: ResultToggle) {
  return toggles.includes(toggle)
    ? toggles.filter((item) => item !== toggle)
    : [...toggles, toggle];
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
