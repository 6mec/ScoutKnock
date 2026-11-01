import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";
import {
  MAX_ADDRESS,
  MAX_COMPANY_NAME,
  MAX_LOCALITY,
  MAX_NICHE,
  MAX_PHONE,
  createDemoSlug,
  parseDemoContent,
  parseDemoDraft,
} from "./rules";

const draft = {
  companyName: " Barbearia do João ",
  niche: " Barbearias ",
  locality: " Porto ",
  address: " Rua A, 1 ",
  phone: " +351 900 000 001 ",
};

describe("dados escritos no formulário da demo", () => {
  it("limpa os espaços", () => {
    expect(parseDemoDraft(draft)).toEqual({
      companyName: "Barbearia do João",
      niche: "Barbearias",
      locality: "Porto",
      address: "Rua A, 1",
      phone: "+351 900 000 001",
    });
  });

  it("o telefone é opcional", () => {
    expect(parseDemoDraft({ ...draft, phone: "  " })?.phone).toBeNull();
    expect(parseDemoDraft({ ...draft, phone: null })?.phone).toBeNull();
  });

  it.each([
    null,
    "texto",
    { ...draft, companyName: " " },
    { ...draft, niche: "" },
    { ...draft, locality: "" },
    { ...draft, address: "" },
    { ...draft, phone: 3 },
    { ...draft, companyName: "a".repeat(MAX_COMPANY_NAME + 1) },
    { ...draft, niche: "a".repeat(MAX_NICHE + 1) },
    { ...draft, locality: "a".repeat(MAX_LOCALITY + 1) },
    { ...draft, address: "a".repeat(MAX_ADDRESS + 1) },
    { ...draft, phone: "1".repeat(MAX_PHONE + 1) },
  ])("rejeita %j", (value) => {
    expect(parseDemoDraft(value)).toBeNull();
  });

  it("guardar a demo exige os mesmos dados", () => {
    const rest = {
      template: "classic",
      accentColor: "#0F766E",
      headline: "H",
      intro: "I",
    };
    expect(parseDemoContent({ ...draft, ...rest })?.address).toBe("Rua A, 1");
    expect(parseDemoContent({ ...draft, ...rest, address: "" })).toBeNull();
  });

  it("criar uma demo não consulta o fornecedor de empresas", () => {
    const source = readFileSync("src/lib/demos/actions.ts", "utf8");
    expect(source).not.toMatch(/getCompanyProvider|lookupCompany|findById/);
  });
});

describe("endereço e indexação", () => {
  it("o endereço tem o formato da base de dados e não se repete", () => {
    const slugs = Array.from({ length: 5000 }, createDemoSlug);
    slugs.forEach((slug) => expect(slug).toMatch(/^[a-z0-9]{12}$/));
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("todas as letras saem com a mesma frequência, sem desvio visível", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 30000; i += 1) {
      for (const char of createDemoSlug()) {
        counts.set(char, (counts.get(char) ?? 0) + 1);
      }
    }
    const expected = (30000 * 12) / 36;
    expect(counts.size).toBe(36);
    counts.forEach((count) => {
      expect(Math.abs(count - expected) / expected).toBeLessThan(0.05);
    });
  });

  it("as demos levam noindex no cabeçalho", async () => {
    const rules = await nextConfig.headers?.();
    const demo = rules?.find((rule) => rule.source === "/demo/:path*");
    expect(demo?.headers).toContainEqual({
      key: "X-Robots-Tag",
      value: "noindex, nofollow",
    });
  });
});
