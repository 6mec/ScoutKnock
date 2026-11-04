import { describe, expect, it } from "vitest";
import { MAX_SERVICES, parsePortfolio, portfolioUrl, suggestSlug } from "./rules";

const base = {
  slug: "daniel-sites",
  published: true,
  displayName: " Daniel Araújo ",
  headline: "Sites para comércio local",
  about: "",
  city: "Porto",
  whatsapp: "912 345 678",
  email: "daniel@exemplo.pt",
  services: [
    { title: "Site de uma página", description: "Pronto em 5 dias" },
    { title: "", description: "linha vazia fica de fora" },
  ],
  projects: [{ title: "Barbearia do Zé", description: "", url: "barbeariadoze.pt" }],
  showSites: true,
};

describe("parsePortfolio", () => {
  it("limpa os espaços, tira linhas vazias e completa o endereço", () => {
    const result = parsePortfolio(base);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.portfolio.displayName).toBe("Daniel Araújo");
    expect(result.portfolio.about).toBeNull();
    expect(result.portfolio.services).toEqual([
      { title: "Site de uma página", description: "Pronto em 5 dias" },
    ]);
    expect(result.portfolio.projects[0].url).toBe("https://barbeariadoze.pt/");
  });

  it.each([
    [{ slug: "a" }, "slug"],
    [{ slug: "painel" }, "slug"],
    [{ slug: "Com Espaços" }, "slug"],
    [{ displayName: "  " }, "displayName"],
    [{ whatsapp: "253 000 000" }, "whatsapp"],
    [{ email: "sem-arroba" }, "email"],
    [{ projects: [{ title: "X", url: "javascript:alert(1)" }] }, "url"],
    [{ headline: "a".repeat(121) }, "tooLong"],
  ])("recusa %j", (change, error) => {
    expect(parsePortfolio({ ...base, ...change })).toEqual({ ok: false, error });
  });

  it("aceita o nome em maiúsculas e corta o excesso de serviços", () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ title: `S${i}`, description: "" }));
    const result = parsePortfolio({ ...base, slug: "Daniel-Sites", services: many });
    expect(result.ok && result.portfolio.slug).toBe("daniel-sites");
    expect(result.ok && result.portfolio.services).toHaveLength(MAX_SERVICES);
  });

  it("sem published fica por publicar", () => {
    const result = parsePortfolio({ ...base, published: "sim" });
    expect(result.ok && result.portfolio.published).toBe(false);
  });
});

describe("endereços", () => {
  it("sugere um nome a partir do nome da pessoa", () => {
    expect(suggestSlug("Daniel Araújo")).toBe("daniel-araujo");
    expect(suggestSlug("Jo")).toBe("");
  });

  it("monta o endereço público", () => {
    expect(portfolioUrl("daniel", "https://scoutknock.pt")).toBe("https://scoutknock.pt/p/daniel");
  });
});
