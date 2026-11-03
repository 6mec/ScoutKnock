import { describe, expect, it } from "vitest";
import { ptPT } from "@/i18n/pt-PT";
import { getCompanyProvider, sampleProvider } from "./provider";
import {
  HERO_COMPANIES,
  LANDING_EXAMPLE,
  SIMULATION_NICHES,
} from "./landing-examples";
import { SAMPLE_COMPANIES } from "./sample-companies";
import { scoreCompany, scoreLevel } from "./score";
import type { Company } from "./types";

const service = "website_creation";

const base: Company = {
  id: "t",
  name: "Teste",
  niche: "Barbearias",
  locality: "Porto",
  address: "Rua",
  website: "https://teste.example",
  reviewCount: 100,
  hasOpeningHours: true,
  site: { isSlow: false, isMobileFriendly: true, isOutdated: false },
};

const codes = (company: Company) =>
  scoreCompany(company, service).reasons.map((reason) => reason.code);

describe("scoreCompany (criação de sites)", () => {
  it("dá 100 sem site, com poucas avaliações e sem horário", () => {
    const result = scoreCompany(
      { ...base, website: null, reviewCount: 0, hasOpeningHours: false },
      service,
    );
    expect(result.score).toBe(100);
    expect(result.level).toBe("strong");
  });

  it("dá 100 com site e todos os motivos", () => {
    const result = scoreCompany(
      {
        ...base,
        reviewCount: 19,
        hasOpeningHours: false,
        site: { isSlow: true, isMobileFriendly: false, isOutdated: true },
      },
      service,
    );
    expect(result.score).toBe(100);
  });

  it("dá 0 sem nenhum motivo", () => {
    expect(scoreCompany(base, service)).toEqual({
      score: 0,
      level: "weak",
      reasons: [],
    });
  });

  it("dá os pontos certos a cada motivo", () => {
    const points = (change: Partial<Company>) =>
      scoreCompany({ ...base, ...change }, service).score;
    const site = base.site;

    expect(points({ website: null })).toBe(70);
    expect(points({ site: { ...site, isSlow: true } })).toBe(25);
    expect(points({ site: { ...site, isMobileFriendly: false } })).toBe(25);
    expect(points({ site: { ...site, isOutdated: true } })).toBe(20);
    expect(points({ reviewCount: 19 })).toBe(20);
    expect(points({ hasOpeningHours: false })).toBe(10);
  });

  it("sem site, ignora os três motivos do site", () => {
    const company = {
      ...base,
      website: null,
      site: { isSlow: true, isMobileFriendly: false, isOutdated: true },
    };
    expect(codes(company)).toEqual(["noWebsite"]);
  });

  it("20 avaliações já não são poucas", () => {
    expect(codes({ ...base, reviewCount: 20 })).toEqual([]);
  });

  it("não dá pontos a sinais do site por verificar", () => {
    const site = { isSlow: null, isMobileFriendly: null, isOutdated: null };
    expect(codes({ ...base, site })).toEqual([]);
  });
});

describe("scoreLevel", () => {
  it.each([
    [0, "weak"],
    [39, "weak"],
    [40, "medium"],
    [69, "medium"],
    [70, "strong"],
    [100, "strong"],
  ])("%i dá %s", (score, level) => {
    expect(scoreLevel(score)).toBe(level);
  });
});

describe("exemplo da landing", () => {
  it("a nota de exemplo é a mesma empresa do radar e dá 90", () => {
    const { example } = ptPT.landing;
    const company = SAMPLE_COMPANIES.find((c) => c.name === example.company);

    expect(company).toEqual(LANDING_EXAMPLE);
    expect(scoreCompany(LANDING_EXAMPLE, service).score).toBe(90);
    expect(scoreCompany(LANDING_EXAMPLE, service).level).toBe("strong");
  });

  it("o herói mostra as notas reais da função, por ordem", () => {
    const results = HERO_COMPANIES.map((company) =>
      scoreCompany(company, service),
    );

    expect(results.map((result) => result.score)).toEqual([90, 70, 55, 0]);
    expect(results.map((result) => result.level)).toEqual([
      "strong",
      "strong",
      "medium",
      "weak",
    ]);
  });

  it("a simulação usa a função real da nota e tem um nível de cada", () => {
    const scores = Object.fromEntries(
      SIMULATION_NICHES.map(({ id, companies }) => [
        id,
        companies.map((company) => scoreCompany(company, service).score),
      ]),
    );

    expect(scores).toEqual({
      pastelarias: [90, 50, 10],
      barbearias: [100, 45, 0],
      oficinas: [70, 65, 25],
    });
    for (const { companies } of SIMULATION_NICHES) {
      expect(
        companies.map((company) => scoreCompany(company, service).level),
      ).toEqual(["strong", "medium", "weak"]);
    }
  });

  it("as empresas da simulação são fictícias e sem contactos", () => {
    for (const { id, companies } of SIMULATION_NICHES) {
      expect(ptPT.landing.example.niches[id]).toBeTruthy();
      for (const company of companies) {
        expect(company.name).toMatch(/Fictícia|Exemplo/);
        expect(company.phone).toBeUndefined();
        if (company.website) expect(company.website).toMatch(/\.example$/);
      }
    }
  });
});

describe("textos", () => {
  it("todos os motivos têm texto", () => {
    const company = {
      ...base,
      reviewCount: 0,
      hasOpeningHours: false,
      site: { isSlow: true, isMobileFriendly: false, isOutdated: true },
    };
    const all = [
      ...codes(company),
      ...codes({ ...company, website: null }),
    ];
    all.forEach((code) => expect(ptPT.radar.reasons[code]).toBeTruthy());
  });
});

describe("fornecedor", () => {
  it("nunca usa dados fictícios em produção", () => {
    expect(getCompanyProvider({ env: { NODE_ENV: "production" } })).toBeNull();
    expect(
      getCompanyProvider({ env: { NODE_ENV: "development" } })?.usesSampleData,
    ).toBe(true);
  });

  it("procura sem distinguir maiúsculas nem acentos", async () => {
    const found = await sampleProvider.search({
      service,
      niche: "BARBEARIÁS",
      locality: "porto",
    });
    expect(found).toHaveLength(4);
  });

  it("devolve vazio sem resultados", async () => {
    const found = await sampleProvider.search({
      service,
      niche: "Dentistas",
      locality: "Faro",
    });
    expect(found).toEqual([]);
  });
});
