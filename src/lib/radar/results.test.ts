import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  addRecentSearch,
  applyResultFilters,
  DEFAULT_RESULT_FILTERS,
  filtersFromPre,
  isLikelyLandline,
  MAX_RECENT_SEARCHES,
  parseRecentSearches,
  phoneKind,
  resultStats,
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

  const ids = (filters: Partial<typeof DEFAULT_RESULT_FILTERS>, saved = none) =>
    applyResultFilters(results, { ...DEFAULT_RESULT_FILTERS, ...filters }, saved).map((r) => r.company.id);

  it("site: sem site próprio inclui as redes sociais; com site, o contrário", () => {
    expect(ids({ site: "none" })).toEqual(["a", "c"]);
    expect(ids({ site: "has" })).toEqual(["b"]);
  });

  it("contacto: telemóvel deixa de fora os fixos; com telefone aceita os dois", () => {
    expect(ids({ contact: "mobile" })).toEqual(["a"]);
    expect(ids({ contact: "phone" })).toEqual(["a", "b"]);
  });

  it("avaliações: menos de 20 ou 20 e mais", () => {
    const list = [item("p", { reviewCount: 19 }), item("q", { reviewCount: 20 })];
    const run = (reviews: "few" | "many") =>
      applyResultFilters(list, { ...DEFAULT_RESULT_FILTERS, reviews }, none).map((r) => r.company.id);
    expect(run("few")).toEqual(["p"]);
    expect(run("many")).toEqual(["q"]);
  });

  it("por guardar esconde o que já está nos contactos", () => {
    expect(ids({ saved: "notSaved" }, new Set(["a"]))).toEqual(["b", "c"]);
  });

  it("os filtros juntam-se", () => {
    expect(ids({ level: "strong", site: "none" })).toEqual(["a"]);
  });

  it("os filtros do formulário passam para os resultados e contam-se", () => {
    const filters = filtersFromPre(["noOwnSite", "mobile"]);
    expect(filters).toMatchObject({ site: "none", contact: "mobile", saved: "all" });
    expect(activeFilterCount(filters)).toBe(2);
    expect(activeFilterCount({ ...DEFAULT_RESULT_FILTERS, sort: "name" })).toBe(0);
  });

  it("conta o que chegou para a faixa de cima", () => {
    expect(resultStats(results, new Set(["b"]))).toEqual({
      total: 3,
      fresh: 2,
      strong: 1,
      noOwnSite: 2,
      mobile: 1,
      saved: 1,
    });
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

  it("classifica o tipo de telefone", () => {
    expect(phoneKind("912 345 678")).toBe("mobile");
    expect(phoneKind("222 000 000")).toBe("landline");
    expect(phoneKind(" ")).toBe("none");
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
