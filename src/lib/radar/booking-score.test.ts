import { describe, expect, it } from "vitest";
import { scoreCompany } from "./score";
import type { Company } from "./types";

function company(overrides: Partial<Company> = {}, site: Partial<Company["site"]> = {}): Company {
  return {
    id: "c1",
    name: "Barbearia Exemplo",
    niche: "Barbearias",
    locality: "Porto",
    address: "Rua",
    website: "https://exemplo.pt",
    reviewCount: 50,
    hasOpeningHours: true,
    ...overrides,
    site: { isSlow: null, isMobileFriendly: null, isOutdated: null, ...site },
  };
}

const codes = (c: Company) => scoreCompany(c, "online_booking").reasons.map((r) => r.code);

describe("nota das marcações online", () => {
  it("uma plataforma de marcações de outra empresa tem motivo próprio", () => {
    const result = scoreCompany(company({ website: "https://booksy.com/pt-pt/123_barbearia" }), "online_booking");
    expect(result.reasons[0]).toMatchObject({ code: "bookingPlatform", observed: { kind: "thirdParty", thirdParty: "booking" } });
    // Nos sites, a mesma empresa continua a ser "sem site próprio".
    expect(scoreCompany(company({ website: "https://booksy.com/pt-pt/123" }), "website_creation").reasons[0].code).toBe("noOwnWebsite");
  });

  it("sem site, ou só com redes sociais, também conta", () => {
    expect(codes(company({ website: null }))).toEqual(["noWebsite"]);
    expect(codes(company({ website: "https://instagram.com/barbearia" }))).toEqual(["noOwnWebsite"]);
  });

  it("num site próprio, só conta o que a verificação observou", () => {
    expect(codes(company({}, { isMobileFriendly: false }))).toEqual(["notMobileFriendly"]);
    expect(codes(company())).toEqual([]);
  });

  it("sem horário publicado pesa mais do que nos sites", () => {
    const booking = scoreCompany(company({ hasOpeningHours: false }), "online_booking").score;
    const site = scoreCompany(company({ hasOpeningHours: false }), "website_creation").score;
    expect(booking).toBeGreaterThan(site);
  });
});
