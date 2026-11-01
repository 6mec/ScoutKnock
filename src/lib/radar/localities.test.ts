import { describe, expect, it } from "vitest";
import { ptPT } from "@/i18n/pt-PT";
import { parseMarkets } from "@/lib/markets";
import {
  findLocation,
  localitiesFor,
  marketOf,
  PORTUGAL_AREAS,
  resolveLocality,
} from "./localities";
import { sampleProvider } from "./provider";
import { hasSampleCompanies, SAMPLE_COMPANIES } from "./sample-companies";

const concelhos = PORTUGAL_AREAS.flatMap((area) => area.concelhos);
const islands = ["Açores", "Madeira"];

describe("interruptor de mercados", () => {
  it.each([undefined, "", "  ", "ES", "BRASIL"])("%s fica só em Portugal", (value) => {
    expect(parseMarkets(value)).toEqual(["PT"]);
  });

  it("lê os mercados conhecidos", () => {
    expect(parseMarkets("PT")).toEqual(["PT"]);
    expect(parseMarkets("pt, br")).toEqual(["PT", "BR"]);
  });
});

describe("localidades", () => {
  it("tem os 18 distritos, as 2 regiões e os 308 concelhos", () => {
    expect(PORTUGAL_AREAS).toHaveLength(20);
    expect(concelhos).toHaveLength(308);
    expect(new Set(concelhos).size).toBe(308);
    expect(
      PORTUGAL_AREAS.filter(({ name }) => !islands.includes(name)).flatMap((a) => a.concelhos),
    ).toHaveLength(278);
    expect(PORTUGAL_AREAS.find(({ name }) => name === "Açores")?.concelhos).toHaveLength(19);
    expect(PORTUGAL_AREAS.find(({ name }) => name === "Madeira")?.concelhos).toHaveLength(11);
  });

  it("os nomes da lista são únicos, para as sugestões", () => {
    const names = localitiesFor(["PT", "BR"]).map(({ name }) => name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("só em Portugal, não aceita cidades do Brasil", () => {
    expect(localitiesFor(["PT"]).every(({ market }) => market === "PT")).toBe(true);
    expect(resolveLocality("São Paulo", ["PT"])).toBeNull();
    expect(findLocation("Curitiba", ["PT"])).toBeNull();
  });

  it("com o Brasil ligado, volta a aceitar", () => {
    expect(resolveLocality("São Paulo", ["PT", "BR"])?.market).toBe("BR");
    expect(marketOf("Curitiba")).toBe("BR");
  });

  it("aceita distritos e concelhos, sem distinguir maiúsculas nem acentos", () => {
    expect(resolveLocality("  vila nova de gaia ", ["PT"])?.name).toBe("Vila Nova de Gaia");
    expect(resolveLocality("EVORA", ["PT"])?.name).toBe("Évora");
    expect(resolveLocality("Açores", ["PT"])?.name).toBe("Açores");
    expect(resolveLocality("Lagoa (Algarve)", ["PT"])?.group).toBe("Faro");
    expect(resolveLocality("Porto Inventado", ["PT"])).toBeNull();
  });
});

describe("dados de exemplo", () => {
  it("o aviso nomeia exatamente as localidades com empresas", () => {
    const localities = new Set(SAMPLE_COMPANIES.map((company) => company.locality));
    expect([...localities].sort()).toEqual(["Braga", "Coimbra", "Lisboa", "Porto"]);
    localities.forEach((name) => expect(ptPT.radar.sampleOnlyIn).toContain(name));
  });

  it("todas estão na lista, e são fictícias", () => {
    SAMPLE_COMPANIES.forEach((company) => {
      expect(resolveLocality(company.locality, ["PT"])).not.toBeNull();
      expect(company.id).toMatch(/^sample-/);
      if (company.website) expect(company.website).toMatch(/\.example$/);
    });
  });

  it("Braga e Coimbra têm resultados; Faro não", async () => {
    const service = "website_creation";
    expect(await sampleProvider.search({ service, niche: "Barbearias", locality: "Braga" })).toHaveLength(1);
    expect(await sampleProvider.search({ service, niche: "Restaurantes", locality: "Coimbra" })).toHaveLength(1);
    expect(hasSampleCompanies("coimbra")).toBe(true);
    expect(hasSampleCompanies("Faro")).toBe(false);
  });
});
