import { describe, expect, it } from "vitest";
import { canonicalRedirect, homePortfolioSlug, parseSiteUrl, portfolioPath, siteUrl } from "./site";

describe("parseSiteUrl", () => {
  it("aceita o domínio com ou sem https e tira a barra do fim", () => {
    expect(parseSiteUrl("exemplo.pt")).toBe("https://exemplo.pt");
    expect(parseSiteUrl(" https://exemplo.pt/ ")).toBe("https://exemplo.pt");
    expect(parseSiteUrl("http://localhost:3000")).toBe("http://localhost:3000");
    expect(parseSiteUrl("https://nome.netlify.app/p/x")).toBe("https://nome.netlify.app");
  });
  it("recusa vazio, outros protocolos e lixo", () => {
    expect(parseSiteUrl("")).toBeNull();
    expect(parseSiteUrl(undefined)).toBeNull();
    expect(parseSiteUrl("ftp://x.pt")).toBeNull();
    expect(parseSiteUrl("https://")).toBeNull();
  });
  it("sem SITE_URL válido, usa o endereço local", () => {
    expect(siteUrl({})).toBe("http://localhost:3000");
    expect(siteUrl({ SITE_URL: "exemplo.pt" })).toBe("https://exemplo.pt");
  });
});

describe("portfólio na raiz", () => {
  it("lê HOME_PORTFOLIO_SLUG só se for um endereço de portfólio", () => {
    expect(homePortfolioSlug({ HOME_PORTFOLIO_SLUG: " Ana " })).toBe("ana");
    expect(homePortfolioSlug({})).toBeNull();
    expect(homePortfolioSlug({ HOME_PORTFOLIO_SLUG: "../painel" })).toBeNull();
    expect(homePortfolioSlug({ HOME_PORTFOLIO_SLUG: "-ana" })).toBeNull();
  });

  it("o portfólio da raiz tem o caminho /; os outros, /p/nome", () => {
    expect(portfolioPath("ana", "ana")).toBe("/");
    expect(portfolioPath("rui", "ana")).toBe("/p/rui");
    expect(portfolioPath("ana", null)).toBe("/p/ana");
  });
});

describe("endereço principal", () => {
  const env = { SITE_URL: "https://exemplo.pt" };

  it("www e o endereço de produção da Netlify vão para o domínio, com o caminho", () => {
    expect(canonicalRedirect("www.exemplo.pt", "/p/ana?x=1", env)).toBe("https://exemplo.pt/p/ana?x=1");
    expect(canonicalRedirect("meu-site.netlify.app", "/", env)).toBe("https://exemplo.pt/");
    expect(canonicalRedirect("Meu-Site.Netlify.App:443", "/entrar", env)).toBe("https://exemplo.pt/entrar");
  });

  it("o próprio domínio, as pré-visualizações e o localhost ficam", () => {
    expect(canonicalRedirect("exemplo.pt", "/", env)).toBeNull();
    expect(canonicalRedirect("deploy-preview-12--meu-site.netlify.app", "/", env)).toBeNull();
    expect(canonicalRedirect("ramo--meu-site.netlify.app", "/", env)).toBeNull();
    expect(canonicalRedirect("localhost:3000", "/", env)).toBeNull();
    expect(canonicalRedirect("outro.pt", "/", env)).toBeNull();
    expect(canonicalRedirect(null, "/", env)).toBeNull();
  });

  it("sem domínio próprio em https (Fase A, local), nunca reencaminha", () => {
    expect(canonicalRedirect("meu-site.netlify.app", "/", { SITE_URL: "https://meu-site.netlify.app" })).toBeNull();
    expect(canonicalRedirect("meu-site.netlify.app", "/", { SITE_URL: "http://localhost:3000" })).toBeNull();
    expect(canonicalRedirect("meu-site.netlify.app", "/", {})).toBeNull();
    expect(canonicalRedirect("www.exemplo.pt", "/", { SITE_URL: "http://exemplo.pt" })).toBeNull();
  });
});
