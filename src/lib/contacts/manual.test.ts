import { describe, expect, it } from "vitest";
import { scoreCompany } from "@/lib/radar/score";
import {
  MAX_IMPORT_ROWS,
  companyFromManual,
  googleMapsSearchUrl,
  isManualCompanyId,
  manualColumns,
  normalizeWebsite,
  parseCompanyList,
  parseManualCompany,
  phoneDigits,
} from "./manual";

const reasonsOf = (value: Record<string, unknown>) =>
  scoreCompany(
    companyFromManual("manual-1", parseManualCompany(value)!),
    "website_creation",
  ).reasons.map((reason) => reason.code);

describe("parseManualCompany", () => {
  it("aceita só o nome e limpa espaços", () => {
    expect(parseManualCompany({ name: "  Barbearia   Exemplo " })).toEqual({
      name: "Barbearia Exemplo",
      niche: null,
      locality: null,
      address: null,
      phone: null,
      website: null,
      reviews: null,
      hours: null,
    });
  });

  it("recusa sem nome, textos longos e tipos errados", () => {
    expect(parseManualCompany({ name: "  " })).toBeNull();
    expect(parseManualCompany({ name: "a".repeat(121) })).toBeNull();
    expect(parseManualCompany({ name: "X", niche: "a".repeat(81) })).toBeNull();
    expect(parseManualCompany({ name: "X", hours: "sim" })).toBeNull();
    expect(parseManualCompany({ name: "X", reviews: -1 })).toBeNull();
    expect(parseManualCompany({ name: "X", reviews: "doze" })).toBeNull();
    expect(parseManualCompany(null)).toBeNull();
  });

  it("completa o site e recusa o que não é http", () => {
    expect(parseManualCompany({ name: "X", website: "exemplo.pt" })?.website).toBe(
      "https://exemplo.pt/",
    );
    expect(normalizeWebsite("javascript:alert(1)")).toBeUndefined();
    expect(normalizeWebsite("ftp://exemplo.pt")).toBeUndefined();
    expect(normalizeWebsite("semponto")).toBeUndefined();
    expect(parseManualCompany({ name: "X", website: "javascript:alert(1)" })).toBeNull();
  });

  it("guarda nas colunas manual_*", () => {
    const company = parseManualCompany({ name: "X", phone: "912 345 678", reviews: "12", hours: false })!;
    expect(manualColumns(company)).toMatchObject({
      manual_phone: "912 345 678",
      manual_reviews: 12,
      manual_hours: false,
    });
  });
});

describe("nota das empresas manuais", () => {
  it("sem site, poucas avaliações e sem horário, quando foi isso que se escreveu", () => {
    expect(reasonsOf({ name: "X", reviews: 5, hours: false })).toEqual([
      "noWebsite",
      "fewReviews",
      "noOpeningHours",
    ]);
  });

  it("o que não foi escrito não vira motivo", () => {
    expect(reasonsOf({ name: "X", website: "exemplo.pt" })).toEqual([]);
  });

  it("um Instagram conta como sem site próprio", () => {
    expect(reasonsOf({ name: "X", website: "instagram.com/barbearia" })).toEqual([
      "noOwnWebsite",
    ]);
  });

  it("reconhece o prefixo", () => {
    expect(isManualCompanyId("manual-abc")).toBe(true);
    expect(isManualCompanyId("ChIJabc")).toBe(false);
  });
});

describe("parseCompanyList", () => {
  it("sem cabeçalho, lê nome, telefone, nicho, localidade e site", () => {
    const parsed = parseCompanyList(
      "Barbearia Exemplo; 912 345 678; Barbearias; Porto; \nCafé Fictício\t913000000\tCafés\tBraga\tcafe.example",
    );

    expect(parsed.companies).toHaveLength(2);
    expect(parsed.companies[0]).toMatchObject({
      name: "Barbearia Exemplo",
      phone: "912 345 678",
      niche: "Barbearias",
      locality: "Porto",
      website: null,
    });
    expect(parsed.companies[1].website).toBe("https://cafe.example/");
  });

  it("com cabeçalho, lê as colunas pelo nome em qualquer ordem", () => {
    const parsed = parseCompanyList(
      "Telefone,Nome,Avaliações\n912345678,\"Oficina, Lda\",8",
    );

    expect(parsed.companies).toEqual([
      expect.objectContaining({ name: "Oficina, Lda", phone: "912345678", reviews: 8 }),
    ]);
  });

  it("salta repetidas pelo nome ou pelo telefone, também contra as já guardadas", () => {
    const parsed = parseCompanyList(
      "Barbearia Exemplo;912345678\nbarbearia exemplo;\nOutra;+351 912 345 678\nNova;933000000\nJá Guardada;",
      [{ label: "Já guardada", phone: null }],
    );

    expect(parsed.companies.map((company) => company.name)).toEqual([
      "Barbearia Exemplo",
      "Nova",
    ]);
    expect(parsed.duplicates).toBe(3);
  });

  it("conta as linhas inválidas e corta acima do limite", () => {
    const lines = Array.from({ length: MAX_IMPORT_ROWS + 5 }, (_, i) => `Empresa ${i}`);
    const parsed = parseCompanyList([";912", ...lines].join("\n"));

    expect(parsed.invalid).toBe(1);
    expect(parsed.companies).toHaveLength(MAX_IMPORT_ROWS - 1);
    expect(parsed.tooMany).toBe(true);
    expect(parseCompanyList("  \n ")).toEqual({
      companies: [],
      invalid: 0,
      duplicates: 0,
      tooMany: false,
    });
  });

  it("o mesmo número com e sem indicativo", () => {
    expect(phoneDigits("+351 912 345 678")).toBe(phoneDigits("912345678"));
  });
});

describe("googleMapsSearchUrl", () => {
  it("usa o link oficial de pesquisa do Maps", () => {
    expect(googleMapsSearchUrl("Barbearias", "Porto")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Barbearias%20em%20Porto",
    );
    expect(googleMapsSearchUrl("Cafés", "")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Caf%C3%A9s",
    );
  });
});
