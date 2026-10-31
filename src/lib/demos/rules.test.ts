import { describe, expect, it } from "vitest";
import { ptPT } from "@/i18n/pt-PT";
import {
  colorForNiche,
  createDemoSlug,
  DEMO_COLORS,
  DEMO_TEMPLATES,
  MAX_INTRO,
  parseAuthorName,
  parseDemoContent,
} from "./rules";

const content = {
  companyName: " Barbearia Horizonte ",
  niche: "Barbearias",
  locality: "Porto",
  address: "Rua A, 1",
  phone: null,
  template: "bold",
  accentColor: DEMO_COLORS.blue,
  headline: "Barbearias · Porto",
  intro: "Texto.",
};

describe("createDemoSlug", () => {
  it("cumpre o formato que a base de dados exige", () => {
    expect(createDemoSlug()).toMatch(/^[a-z0-9]{12}$/);
  });

  it("não repete", () => {
    const slugs = new Set(Array.from({ length: 200 }, createDemoSlug));
    expect(slugs.size).toBe(200);
  });
});

describe("parseDemoContent", () => {
  it("limpa os espaços", () => {
    expect(parseDemoContent(content)?.companyName).toBe("Barbearia Horizonte");
  });

  it.each([
    null,
    "texto",
    { ...content, template: "outro" },
    { ...content, accentColor: "red;background:url(x)" },
    { ...content, accentColor: "#123456" },
    { ...content, companyName: "   " },
    { ...content, headline: 3 },
    { ...content, intro: "a".repeat(MAX_INTRO + 1) },
  ])("rejeita %j", (value) => {
    expect(parseDemoContent(value)).toBeNull();
  });
});

describe("parseAuthorName", () => {
  it("aceita um nome e limpa os espaços", () => {
    expect(parseAuthorName(" Daniel ")).toBe("Daniel");
  });

  it.each([null, "", "   ", "a".repeat(81)])("rejeita %j", (value) => {
    expect(parseAuthorName(value)).toBeNull();
  });
});

describe("textos das demos", () => {
  it("usam só cores da lista", () => {
    expect(Object.values(DEMO_COLORS)).toContain(colorForNiche("Barbearias"));
  });

  it("têm nome para cada modelo e cada cor", () => {
    DEMO_TEMPLATES.forEach((id) =>
      expect(ptPT.demos.editor.templates[id]).toBeTruthy(),
    );
    (Object.keys(DEMO_COLORS) as (keyof typeof DEMO_COLORS)[]).forEach((id) =>
      expect(ptPT.demos.editor.colors[id]).toBeTruthy(),
    );
  });

  it("o aviso nomeia sempre autor e empresa", () => {
    expect(ptPT.demos.notice("Ana", "Horizonte")).toBe(
      "Proposta não oficial. Feita por Ana para Horizonte.",
    );
  });
});
