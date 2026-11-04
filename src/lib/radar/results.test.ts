import { describe, expect, it } from "vitest";
import {
  addRecentSearch,
  applyResultFilters,
  DEFAULT_RESULT_FILTERS,
  isLikelyLandline,
  MAX_RECENT_SEARCHES,
  parseRecentSearches,
  toggleFilter,
} from "./results";
import type { ScoredCompany } from "./search-events";
import type { ScoreLevel } from "./types";

function item(
  id: string,
  {
    score = 50,
    level = "medium",
    website = null,
    phone = null,
    reviewCount = 10,
    notOwn = null,
    name = id,
  }: {
    score?: number;
    level?: ScoreLevel;
    website?: string | null;
    phone?: string | null;
    reviewCount?: number;
    notOwn?: "social" | null;
    name?: string;
  } = {},
): ScoredCompany {
  return {
    company: {
      id,
      name,
      niche: "Barbearias",
      locality: "Porto",
      address: "Rua de Exemplo",
      phone,
      website,
      reviewCount,
      hasOpeningHours: true,
      site: { isSlow: null, isMobileFriendly: null, isOutdated: null, notOwn },
    },
    opportunity: { score, level, reasons: [] },
  };
}

const none = new Set<string>();

describe("filtros dos resultados", () => {
  const results = [
    item("a", { score: 90, level: "strong", phone: "912 345 678" }),
    item("b", { score: 60, level: "medium", website: "https://b.pt", phone: "222 000 000" }),
    item("c", { score: 40, level: "weak", website: "https://instagram.com/c", notOwn: "social" }),
  ];

  it("sem filtros, fica tudo pela ordem da nota", () => {
    expect(applyResultFilters(results, DEFAULT_RESULT_FILTERS, none).map((r) => r.company.id)).toEqual(["a", "b", "c"]);
  });

  it("sem site próprio inclui as redes sociais", () => {
    const filters = { ...DEFAULT_RESULT_FILTERS, toggles: ["noOwnSite" as const] };
    expect(applyResultFilters(results, filters, none).map((r) => r.company.id)).toEqual(["a", "c"]);
  });

  it("com telemóvel deixa de fora os fixos e quem não tem telefone", () => {
    const filters = { ...DEFAULT_RESULT_FILTERS, toggles: ["mobile" as const] };
    expect(applyResultFilters(results, filters, none).map((r) => r.company.id)).toEqual(["a"]);
  });

  it("por guardar esconde o que já está nos contactos", () => {
    const filters = { ...DEFAULT_RESULT_FILTERS, toggles: ["notSaved" as const] };
    expect(applyResultFilters(results, filters, new Set(["a"])).map((r) => r.company.id)).toEqual(["b", "c"]);
  });

  it("os filtros juntam-se ao nível", () => {
    const filters = { level: "strong" as const, toggles: ["noOwnSite" as const], sort: "score" as const };
    expect(applyResultFilters(results, filters, none).map((r) => r.company.id)).toEqual(["a"]);
  });

  it("ordena por menos avaliações e por nome, sem mexer na lista original", () => {
    const list = [
      item("x", { reviewCount: 30, name: "Zé" }),
      item("y", { reviewCount: 5, name: "Ávila" }),
      item("z", { reviewCount: 5, score: 80, name: "barbearia" }),
    ];
    expect(
      applyResultFilters(list, { ...DEFAULT_RESULT_FILTERS, sort: "fewReviews" }, none).map((r) => r.company.id),
    ).toEqual(["z", "y", "x"]);
    expect(
      applyResultFilters(list, { ...DEFAULT_RESULT_FILTERS, sort: "name" }, none).map((r) => r.company.id),
    ).toEqual(["y", "z", "x"]);
    expect(list.map((r) => r.company.id)).toEqual(["x", "y", "z"]);
  });

  it("liga e desliga um filtro", () => {
    expect(toggleFilter([], "mobile")).toEqual(["mobile"]);
    expect(toggleFilter(["mobile", "noOwnSite"], "mobile")).toEqual(["noOwnSite"]);
  });
});

describe("telefone fixo", () => {
  it.each([
    ["222 000 000", true],
    ["+351 222 000 000", false],
    ["912 345 678", false],
    ["", false],
    [null, false],
  ])("%s → %s", (phone, expected) => {
    expect(isLikelyLandline(phone)).toBe(expected);
  });
});

describe("buscas recentes", () => {
  it("guarda a mais recente à frente, sem repetidas e com um máximo", () => {
    let list = addRecentSearch([], { niche: "Barbearias", locality: "Porto" });
    list = addRecentSearch(list, { niche: "Cafés", locality: "Braga" });
    list = addRecentSearch(list, { niche: " barbearias ", locality: "porto" });
    expect(list).toEqual([
      { niche: "barbearias", locality: "porto" },
      { niche: "Cafés", locality: "Braga" },
    ]);
    for (let i = 0; i < 10; i++) list = addRecentSearch(list, { niche: `N${i}`, locality: "Porto" });
    expect(list).toHaveLength(MAX_RECENT_SEARCHES);
  });

  it("ignora o que não for uma lista válida", () => {
    expect(parseRecentSearches(null)).toEqual([]);
    expect(parseRecentSearches("{")).toEqual([]);
    expect(parseRecentSearches('{"a":1}')).toEqual([]);
    expect(parseRecentSearches('[{"niche":"Cafés","locality":"Braga"},{"niche":1},{"niche":"","locality":"x"}]')).toEqual([
      { niche: "Cafés", locality: "Braga" },
    ]);
  });
});
