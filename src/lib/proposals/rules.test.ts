import { describe, expect, it } from "vitest";
import { fillTemplate } from "@/lib/contacts/crm";
import { buildDemoLinks, demoLinkFor, missingVariables } from "@/lib/demos/links";
import { isExpired, parseProposalInput, proposalNumbers } from "./rules";

describe("propostas", () => {
  it("aceita uma proposta completa", () => {
    expect(parseProposalInput({ service: " Site ", value: "1.200,50", deposit: "300", validUntil: "2026-12-01", status: "sent" })).toEqual({
      ok: true,
      input: { service: "Site", value: 1200.5, deposit: 300, validUntil: "2026-12-01", status: "sent" },
    });
  });

  it("recusa o que não está certo", () => {
    expect(parseProposalInput({ service: "", value: "10", status: "draft" })).toEqual({ ok: false, error: "service" });
    expect(parseProposalInput({ service: "Site", value: "", status: "draft" })).toEqual({ ok: false, error: "value" });
    expect(parseProposalInput({ service: "Site", value: "100", deposit: "200", status: "draft" })).toEqual({ ok: false, error: "deposit" });
    expect(parseProposalInput({ service: "Site", value: "100", validUntil: "2026-02-31", status: "draft" })).toEqual({ ok: false, error: "date" });
    expect(parseProposalInput({ service: "Site", value: "100", status: "talvez" })).toEqual({ ok: false, error: "status" });
  });

  it("abertas são as enviadas; vendas do mês as aceites decididas este mês", () => {
    const numbers = proposalNumbers(
      [
        { status: "sent", value: "500", decided_on: null },
        { status: "draft", value: "999", decided_on: null },
        { status: "accepted", value: 900, decided_on: "2026-11-03" },
        { status: "accepted", value: 700, decided_on: "2026-10-30" },
        { status: "refused", value: 100, decided_on: "2026-11-02" },
      ],
      "2026-11-08",
    );
    expect(numbers).toEqual({ openCount: 1, openValue: 500, salesCount: 1, salesValue: 900 });
  });

  it("expira só se foi enviada e a validade passou", () => {
    expect(isExpired({ status: "sent", valid_until: "2026-11-01" }, "2026-11-08")).toBe(true);
    expect(isExpired({ status: "sent", valid_until: "2026-11-08" }, "2026-11-08")).toBe(false);
    expect(isExpired({ status: "accepted", valid_until: "2026-11-01" }, "2026-11-08")).toBe(false);
  });
});

describe("mensagens com {empresa}, {link_demo} e {link_portfolio}", () => {
  const links = buildDemoLinks(
    [
      { slug: "a1", company_id: "osm-1", niche: "Barbearias", niche_example: false },
      { slug: "ex", company_id: "osm-9", niche: "Barbearias", niche_example: true },
    ],
    "https://scoutkncok.com/",
  );

  it("a demo da própria empresa primeiro, depois o exemplo do mesmo nicho", () => {
    expect(demoLinkFor(links, { company_id: "osm-1", manual_niche: "Barbearias" })).toBe("https://scoutkncok.com/demo/a1");
    expect(demoLinkFor(links, { company_id: "osm-2", manual_niche: " barbearias " })).toBe("https://scoutkncok.com/demo/ex");
    expect(demoLinkFor(links, { company_id: "osm-3", manual_niche: "Cafés" })).toBeNull();
  });

  it("preenche as variáveis novas e as antigas", () => {
    expect(fillTemplate("Olá {empresa}! Demo: {link_demo} · {link_portfolio}", "Café", "https://x.pt", "https://x.pt/demo/a")).toBe(
      "Olá Café! Demo: https://x.pt/demo/a · https://x.pt",
    );
    expect(fillTemplate("Olá {nome}, vê {portfolio}", "Café", "https://x.pt")).toBe("Olá Café, vê https://x.pt");
    expect(fillTemplate("Olá {empresa}! {link_demo}", "Café", null, null)).toBe("Olá Café!");
  });

  it("avisa das variáveis que ficariam vazias", () => {
    expect(missingVariables("Olá {empresa} {link_demo} {link_portfolio}", { demo: null, portfolio: null })).toEqual(["demo", "portfolio"]);
    expect(missingVariables("Olá {nome} {portfolio}", { demo: null, portfolio: "https://x.pt" })).toEqual([]);
  });
});
