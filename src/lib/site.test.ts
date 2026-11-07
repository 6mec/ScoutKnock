import { describe, expect, it } from "vitest";
import { parseSiteUrl, siteUrl } from "./site";

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
