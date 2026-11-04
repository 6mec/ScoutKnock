import { describe, expect, it } from "vitest";
import type { Company } from "@/lib/radar/types";
import {
  averageWonValue,
  buildCallScript,
  callScriptText,
  closeRate,
  diagnosisItems,
  parsePlannerInput,
  planMonth,
  siteGrade,
} from "./rules";

function company(overrides: Partial<Company> = {}, site: Partial<Company["site"]> = {}): Company {
  return {
    id: "c1",
    name: "Barbearia Exemplo",
    niche: "Barbearias",
    locality: "Porto",
    address: "Rua",
    website: "https://exemplo.pt",
    reviewCount: 10,
    hasOpeningHours: true,
    ...overrides,
    site: { isSlow: null, isMobileFriendly: null, isOutdated: null, ...site },
  };
}

describe("nota do site", () => {
  it("sem site, sem site próprio ou por verificar não têm letra", () => {
    expect(siteGrade(company({ website: null }))).toEqual({ kind: "none" });
    expect(siteGrade(company({}, { notOwn: "social" }))).toEqual({ kind: "notOwn" });
    expect(siteGrade(company())).toEqual({ kind: "unchecked" });
  });

  it("dá a letra pelo número de problemas observados", () => {
    expect(siteGrade(company({}, { isSlow: false, isMobileFriendly: true, isOutdated: false }))).toMatchObject({ grade: "A", bad: 0, total: 3 });
    expect(siteGrade(company({}, { isSlow: true, isMobileFriendly: true, isOutdated: false }))).toMatchObject({ grade: "B" });
    expect(siteGrade(company({}, { isSlow: true, isMobileFriendly: false, isOutdated: true }))).toMatchObject({ grade: "D", bad: 3 });
  });

  it("não conta o que ficou por verificar", () => {
    expect(siteGrade(company({}, { isSlow: true }))).toMatchObject({ grade: "B", bad: 1, total: 1 });
  });
});

describe("guião de chamada", () => {
  it("usa só os motivos encontrados, no máximo dois", () => {
    const script = buildCallScript({
      companyName: "Barbearia Exemplo",
      niche: "Barbearias",
      reasons: ["noWebsite", "fewReviews", "noOpeningHours"],
      senderName: "Ana",
    });
    expect(script.why).toHaveLength(2);
    expect(script.why[0]).toContain("Barbearia Exemplo");
    expect(script.opening).toContain("Ana");
    expect(script.opening).toContain("barbearias");
  });

  it("sem motivos nem nome continua a fazer sentido", () => {
    const script = buildCallScript({ companyName: "X", niche: "Cafés", reasons: [], senderName: "  " });
    expect(script.why).toHaveLength(1);
    expect(script.opening).not.toContain("Chamo-me");
    expect(script.voicemail).not.toContain("fala");
  });

  it("nunca fala de preços, números ou promessas", () => {
    const text = callScriptText("t", buildCallScript({ companyName: "X", niche: "Cafés", reasons: ["slowSite"], senderName: "Ana" }));
    expect(text).not.toMatch(/\d+\s?(€|%|euros)/);
    expect(text).not.toMatch(/garant/i);
  });
});

describe("diagnóstico", () => {
  it("tem um item por motivo e nada mais", () => {
    const items = diagnosisItems({
      score: 45,
      level: "medium",
      reasons: [
        { code: "slowSite", points: 25 },
        { code: "noOpeningHours", points: 10 },
      ],
    });
    expect(items.map((item) => item.code)).toEqual(["slowSite", "noOpeningHours"]);
    expect(items[0].meaning.length).toBeGreaterThan(10);
  });
});

describe("planeador do mês", () => {
  it("calcula vendas, contactos e ritmo por dia útil", () => {
    expect(planMonth({ goal: 2000, price: 600, ratePercent: 10 })).toEqual({ sales: 4, contacts: 40, perDay: 2 });
    expect(planMonth({ goal: 2000, price: 600, ratePercent: null })).toEqual({ sales: 4, contacts: null, perDay: null });
    expect(planMonth({ goal: null, price: 600, ratePercent: 10 })).toBeNull();
  });

  it("só calcula a taxa com contactos fechados suficientes", () => {
    expect(closeRate(["won", "lost", "contacted"])).toBeNull();
    expect(closeRate(["won", "lost", "lost", "lost", "won", "to_contact"])).toEqual({ won: 2, decided: 5, percent: 40 });
  });

  it("a média das propostas ganhas ignora as sem valor", () => {
    expect(averageWonValue([
      { status: "won", deal_value: 500 },
      { status: "won", deal_value: 700 },
      { status: "won", deal_value: null },
      { status: "lost", deal_value: 900 },
    ])).toBe(600);
    expect(averageWonValue([])).toBeNull();
  });

  it("lê o que ficou guardado e ignora valores estranhos", () => {
    expect(parsePlannerInput('{"goal":2000,"price":-5,"ratePercent":150}')).toEqual({ goal: 2000, price: null, ratePercent: null });
    expect(parsePlannerInput("{")).toEqual({ goal: null, price: null, ratePercent: null });
  });
});
