import { describe, expect, it } from "vitest";
import { imagePath, publicImageUrl, sniffImage } from "./images";
import {
  checkSlug,
  MAX_SERVICES,
  parsePortfolio,
  parseTestimonial,
  parseWork,
  portfolioUrl,
  suggestSlug,
} from "./rules";

const base = {
  slug: "daniel-sites",
  published: true,
  indexable: false,
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
  processSteps: [
    { title: "Conversa", text: "Falamos." },
    { title: "", text: "" },
  ],
  priceFrom: " 350 € a criação ",
};

describe("parsePortfolio", () => {
  it("limpa os espaços e tira linhas vazias", () => {
    const result = parsePortfolio(base);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.portfolio.displayName).toBe("Daniel Araújo");
    expect(result.portfolio.about).toBeNull();
    expect(result.portfolio.services).toEqual([{ title: "Site de uma página", description: "Pronto em 5 dias" }]);
    expect(result.portfolio.processSteps).toEqual([{ title: "Conversa", text: "Falamos." }]);
    expect(result.portfolio.priceFrom).toBe("350 € a criação");
    expect(result.portfolio.indexable).toBe(false);
  });

  it.each([
    [{ slug: "a" }, "slug"],
    [{ slug: "painel" }, "slug"],
    [{ slug: "Com Espaços" }, "slug"],
    [{ displayName: "  " }, "displayName"],
    [{ whatsapp: "253 000 000" }, "whatsapp"],
    [{ email: "sem-arroba" }, "email"],
    [{ headline: "a".repeat(121) }, "tooLong"],
    [{ services: [{ title: "Site", description: "" }] }, "serviceLine"],
    [{ services: [{ title: "Site", description: "a".repeat(101) }] }, "tooLong"],
    [{ processSteps: [{ title: "Só título", text: "" }] }, "step"],
    [{ priceFrom: "a".repeat(61) }, "tooLong"],
    [{ about: "a minha senha: 1234" }, "secret"],
  ])("recusa %j", (change, error) => {
    expect(parsePortfolio({ ...base, ...change })).toEqual({ ok: false, error });
  });

  it("aceita o nome em maiúsculas e corta o excesso de serviços", () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ title: `S${i}`, description: "Uma linha" }));
    const result = parsePortfolio({ ...base, slug: "Daniel-Sites", services: many });
    expect(result.ok && result.portfolio.slug).toBe("daniel-sites");
    expect(result.ok && result.portfolio.services).toHaveLength(MAX_SERVICES);
  });

  it("sem published nem indexable verdadeiros, fica por publicar e fora do Google", () => {
    const result = parsePortfolio({ ...base, published: "sim", indexable: "sim" });
    expect(result.ok && result.portfolio.published).toBe(false);
    expect(result.ok && result.portfolio.indexable).toBe(false);
  });
});

describe("checkSlug", () => {
  it("diz como fica, sem acentos nem espaços", () => {
    expect(checkSlug("Daniel Araújo", "Daniel Araújo")).toEqual({ slug: "daniel-araujo", valid: true, warnings: ["changed"], suggestion: null });
  });
  it("apanha erros de escrita perto do nome", () => {
    const result = checkSlug("danial-araujo", "Daniel Araújo");
    expect(result.suggestion).toBe("daniel-araujo");
    expect(result.warnings).toContain("typo");
    expect(checkSlug("sites-porto", "Daniel Araújo").suggestion).toBeNull();
  });
  it("avisa de hífenes duplos, formato e nomes reservados", () => {
    expect(checkSlug("daniel--sites", "").warnings).toContain("doubleHyphen");
    expect(checkSlug("ab", "").warnings).toContain("format");
    expect(checkSlug("painel", "").warnings).toContain("reserved");
  });
});

describe("parseWork", () => {
  it("só mostra projetos entregues, com frase", () => {
    expect(parseWork({ show: true, summary: "Site", url: "" }, "in_progress")).toEqual({ ok: false, error: "status" });
    expect(parseWork({ show: true, summary: "", url: "" }, "delivered")).toEqual({ ok: false, error: "summary" });
    expect(parseWork({ show: true, summary: " Site da barbearia ", url: "barbearia.pt" }, "maintenance")).toEqual({
      ok: true,
      work: { show: true, summary: "Site da barbearia", url: "https://barbearia.pt/" },
    });
  });
  it("desligar não pede frase; recusa ligações inválidas e segredos", () => {
    expect(parseWork({ show: false, summary: "", url: "" }, "in_progress")).toEqual({ ok: true, work: { show: false, summary: null, url: null } });
    expect(parseWork({ show: false, url: "javascript:alert(1)" }, "delivered")).toEqual({ ok: false, error: "url" });
    expect(parseWork({ show: true, summary: "password=abc", url: "" }, "delivered")).toEqual({ ok: false, error: "secret" });
  });
});

describe("parseTestimonial", () => {
  it("guarda só o primeiro nome e começa por autorizar", () => {
    expect(parseTestimonial({ firstName: " Maria Sousa ", company: "Café Sol", quote: "Gostei muito." })).toEqual({
      ok: true,
      testimonial: { firstName: "Maria", company: "Café Sol", quote: "Gostei muito.", authorized: false, projectId: null },
    });
  });
  it("pede nome, empresa e texto", () => {
    expect(parseTestimonial({ firstName: "", company: "x", quote: "x" })).toEqual({ ok: false, error: "firstName" });
    expect(parseTestimonial({ firstName: "x", company: "", quote: "x" })).toEqual({ ok: false, error: "company" });
    expect(parseTestimonial({ firstName: "x", company: "x", quote: "" })).toEqual({ ok: false, error: "quote" });
  });
});

describe("imagens", () => {
  it("reconhece o tipo pelos primeiros bytes", () => {
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImage(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe("image/webp");
    expect(sniffImage(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });
  it("guarda na pasta da pessoa e monta o endereço público", () => {
    expect(imagePath("u1", "p1", "image/webp", 36)).toBe("u1/p1-10.webp");
    expect(publicImageUrl("u1/p1-10.webp", "https://x.supabase.co/")).toBe("https://x.supabase.co/storage/v1/object/public/portfolio/u1/p1-10.webp");
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
