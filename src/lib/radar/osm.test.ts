import { describe, expect, it, vi } from "vitest";
import { scoreCompany } from "./score";
import { buildOverpassQuery, elementToCompany, nicheSelectors, parseOsmId } from "./osm";
import { cachedOsmCompany, createOsmProvider, OVERPASS_ENDPOINTS, rememberOsmCompany } from "./osm-provider";

const porto = { name: "Porto", group: "Porto", market: "PT" as const, location: [41.15, -8.61] as [number, number] };
const acores = { name: "Açores", group: "Açores", market: "PT" as const, location: [37.74, -25.67] as [number, number] };
const lagoaAcores = { name: "Lagoa", group: "Açores", market: "PT" as const, location: [37.74, -25.67] as [number, number] };

describe("consulta ao OpenStreetMap", () => {
  it("o Porto é o concelho, dentro do distrito certo", () => {
    const query = buildOverpassQuery("Barbearias", porto)!;
    expect(query).toContain('area["ISO3166-2"="PT-13"]->.d');
    expect(query).toContain('["admin_level"="7"]["name"="Porto"]');
    expect(query).toContain('["shop"="hairdresser"]');
  });

  it("uma região sem concelho com o mesmo nome procura a região inteira", () => {
    expect(buildOverpassQuery("Cafés", acores)).toContain('area["ISO3166-2"="PT-20"]->.a;');
    // Lagoa existe no Algarve e nos Açores: procura a dos Açores.
    expect(buildOverpassQuery("Cafés", lagoaAcores)).toContain('area["ISO3166-2"="PT-20"]->.d');
  });

  it("conhece os nichos das sugestões e, sem etiqueta, procura pelo nome", () => {
    expect(nicheSelectors("Clínicas dentárias")[0]).toContain('"amenity"="dentist"');
    expect(nicheSelectors("Lavandarias")[0]).toContain('"shop"="laundry"');
    expect(nicheSelectors("Tatuadores")).toEqual(['["name"~"tatuadore",i]']);
  });

  it("não deixa o texto do nicho mudar a consulta", () => {
    expect(nicheSelectors('x"];out;')[0]).toBe('["name"~"x\\"];out;",i]');
  });

  it("lê os ids das empresas", () => {
    expect(parseOsmId("osm-node-123")).toEqual({ type: "node", id: 123 });
    expect(parseOsmId("osm-node-12;out")).toBeNull();
    expect(parseOsmId("ChIJabc")).toBeNull();
  });
});

describe("empresas do OpenStreetMap", () => {
  const element = {
    type: "node" as const,
    id: 42,
    lat: 41.15,
    lon: -8.61,
    tags: {
      name: "Barbearia Apolo",
      "addr:street": "Rua de Santa Catarina",
      "addr:housenumber": "10",
      "addr:postcode": "4000-001",
      "addr:city": "Porto",
      phone: "+351 912 345 678",
      "contact:instagram": "instagram.com/apolo",
    },
  };

  it("monta a empresa só com dados abertos e sem avaliações", () => {
    const company = elementToCompany(element, "Barbearias", "Porto")!;
    expect(company).toMatchObject({
      id: "osm-node-42",
      address: "Rua de Santa Catarina, 10, 4000-001 Porto",
      phone: "+351 912 345 678",
      website: "https://instagram.com/apolo",
      reviewCount: null,
      hasOpeningHours: false,
      location: [41.15, -8.61],
    });
  });

  it("sem avaliações, a nota não diz que são poucas; a página de Instagram conta como sem site próprio", () => {
    const codes = scoreCompany(elementToCompany(element, "Barbearias", "Porto")!, "website_creation").reasons.map((r) => r.code);
    expect(codes).toEqual(["noOwnWebsite", "noOpeningHours"]);
  });

  it("deixa de fora as que não têm nome ou estão fechadas", () => {
    expect(elementToCompany({ type: "node", id: 1, tags: {} }, "x", "Porto")).toBeNull();
    expect(elementToCompany({ type: "node", id: 2, tags: { name: "X", opening_hours: "closed" } }, "x", "Porto")).toBeNull();
  });
});

describe("fornecedor OpenStreetMap", () => {
  const ok = (elements: unknown[]) => new Response(JSON.stringify({ elements }), { status: 200 });

  it("se o primeiro servidor estiver cheio, tenta o seguinte, e tira as repetidas", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("cheio", { status: 504 }))
      .mockResolvedValueOnce(ok([
        { type: "node", id: 1, tags: { name: "A" } },
        { type: "node", id: 1, tags: { name: "A" } },
        { type: "way", id: 2, center: { lat: 1, lon: 2 }, tags: { name: "B" } },
      ]));
    const provider = createOsmProvider({ fetchImpl, siteUrl: "https://exemplo.test" });
    const companies = await provider.search({ service: "website_creation", niche: "Barbearias", locality: "Porto" });
    expect(companies.map((c) => c.id)).toEqual(["osm-node-1", "osm-way-2"]);
    expect(fetchImpl.mock.calls[1][0]).toBe(OVERPASS_ENDPOINTS[1]);
    const init = fetchImpl.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)["User-Agent"]).toBe("ScoutKnock/1.0 (+https://exemplo.test/bot)");
    expect(provider.usesSampleData).toBe(false);
    expect(provider.source).toBe("osm");
  });

  it("com todos os servidores cheios, dá erro", async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => new Response("cheio", { status: 504 }));
    const provider = createOsmProvider({ fetchImpl });
    await expect(provider.search({ service: "website_creation", niche: "Cafés", locality: "Porto" })).rejects.toThrow("osm: 504");
  });

  it("localidade fora da lista não chama o servidor", async () => {
    const fetchImpl = vi.fn();
    const provider = createOsmProvider({ fetchImpl });
    expect(await provider.search({ service: "website_creation", niche: "Cafés", locality: "Atlântida" })).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("encontra uma empresa guardada pelo id", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok([{ type: "node", id: 7, tags: { name: "C", shop: "hairdresser", "addr:city": "Porto" } }]));
    const company = await createOsmProvider({ fetchImpl }).findById("osm-node-7");
    expect(company).toMatchObject({ id: "osm-node-7", name: "C", niche: "hairdresser", locality: "Porto" });
    expect(new URLSearchParams(String((fetchImpl.mock.calls[0][1] as RequestInit).body)).get("data")).toContain("node(7);out center tags;");
  });
});

describe("memória das empresas do OpenStreetMap", () => {
  it("depois de uma busca, encontra a empresa sem voltar ao servidor", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ elements: [{ type: "node", id: 991, tags: { name: "Guardada" } }] }), { status: 200 }),
    );
    const provider = createOsmProvider({ fetchImpl });
    await provider.search({ service: "website_creation", niche: "Barbearias", locality: "Porto" });
    expect((await provider.findById("osm-node-991"))?.name).toBe("Guardada");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("passada uma hora, esquece", () => {
    const company = elementToCompany({ type: "node", id: 992, tags: { name: "Antiga" } }, "x", "Porto")!;
    rememberOsmCompany(company, 0);
    expect(cachedOsmCompany("osm-node-992", 61 * 60 * 1000)).toBeNull();
  });
});
