import { readFileSync } from "node:fs";
import type Stripe from "stripe";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import nextConfig from "../../../next.config";
import { DemoView } from "@/components/demos/demo-view";
import { buildOfficialCheckoutParams, parseBillingConfig, type BillingConfig } from "@/lib/billing/rules";
import { handleStripeEvent } from "@/lib/billing/webhook";
import {
  isLive,
  officialSiteUrl,
  parseRemovalContact,
  parseSiteName,
  subdomainRewritePath,
  suggestSiteName,
} from "./official-rules";
import type { PublicDemo } from "./rules";

const env = {
  STRIPE_SECRET_KEY: "sk_test_abc",
  STRIPE_WEBHOOK_SECRET: "whsec_abc",
  SITE_URL: "https://exemplo.test",
  STRIPE_PRICE_STARTER_EUR: "price_se",
  STRIPE_PRICE_PRO_EUR: "price_pe",
  STRIPE_PRICE_AGENCY_EUR: "price_ae",
  STRIPE_PRICE_OFFICIAL_SITE_EUR: "price_site",
  OFFICIAL_SITE_REMOVAL_CONTACT: "remover@exemplo.test",
};
const config = parseBillingConfig(env) as BillingConfig;

describe("configuração", () => {
  it("sem preço ou contacto, só a publicação fica desligada", () => {
    expect(config.officialSite).toEqual({
      priceId: "price_site",
      removalContact: "remover@exemplo.test",
    });
    for (const name of ["STRIPE_PRICE_OFFICIAL_SITE_EUR", "OFFICIAL_SITE_REMOVAL_CONTACT"]) {
      const other = parseBillingConfig({ ...env, [name]: "" });
      expect(other).not.toBeNull();
      expect(other?.officialSite).toBeNull();
    }
  });

  it("o contacto tem de ser um email simples", () => {
    expect(parseRemovalContact("sem-arroba")).toBeNull();
    expect(parseRemovalContact("a@b.pt?bcc=x y")).toBeNull();
    expect(parseRemovalContact(' a"b@c.pt')).toBeNull();
  });
});

describe("nome do site", () => {
  it.each(["barbearia-real", "abc", "a1b", "x".repeat(40)])("aceita %s", (name) => {
    expect(parseSiteName(name)).toBe(name);
  });

  it.each([
    "ab", "x".repeat(41), "-abc", "abc-", "Maiusculas", "com espaço", "../admin",
    "a/b", "<script>", "www", "api", "admin", "bot", 12, null,
  ])("recusa %s", (name) => {
    expect(parseSiteName(name)).toBeNull();
  });

  it("sugere a partir do nome da empresa", () => {
    expect(suggestSiteName("Café São João & Filhos, Lda.")).toBe("cafe-sao-joao-filhos-lda");
    expect(parseSiteName(suggestSiteName("Café São João"))).toBe("cafe-sao-joao");
    expect(suggestSiteName("<script>alert(1)</script>")).toBe("script-alert-1-script");
  });

  it("os nomes reservados batem certo com a base de dados", () => {
    const sql = readFileSync("supabase/migrations/20261112000000_official_sites.sql", "utf8");
    const list = sql.match(/any \(array\[([\s\S]*?)\]\)/)?.[1] ?? "";
    for (const name of [...list.matchAll(/'([^']+)'/g)].map((m) => m[1])) {
      expect(parseSiteName(name), name).toBeNull();
    }
  });
});

describe("endereço", () => {
  const siteUrl = "https://exemplo.test";

  it("sem domínio fica no caminho; com domínio passa ao subdomínio", () => {
    expect(officialSiteUrl("loja", { siteUrl })).toBe("https://exemplo.test/s/loja");
    expect(officialSiteUrl("loja", { siteUrl, baseDomain: "sites.pt" })).toBe("https://loja.sites.pt/");
  });

  it("o subdomínio só funciona com a variável, e só com nomes válidos", () => {
    expect(subdomainRewritePath("loja.sites.pt", "/")).toBeNull();
    expect(subdomainRewritePath("loja.sites.pt", "/", "sites.pt")).toBe("/s/loja");
    expect(subdomainRewritePath("loja.sites.pt:443", "/", "sites.pt")).toBe("/s/loja");
    expect(subdomainRewritePath("sites.pt", "/", "sites.pt")).toBeNull();
    expect(subdomainRewritePath("www.sites.pt", "/", "sites.pt")).toBeNull();
    expect(subdomainRewritePath("a.b.sites.pt", "/", "sites.pt")).toBeNull();
    expect(subdomainRewritePath("loja.outro.pt", "/", "sites.pt")).toBeNull();
    expect(subdomainRewritePath("loja.sites.pt", "/painel", "sites.pt")).toBeNull();
  });
});

describe("Checkout do site", () => {
  it("leva a marca própria, sem teste grátis e acaba antes da reserva do nome", () => {
    const now = 1_800_000_000_000;
    const params = buildOfficialCheckoutParams({
      config,
      priceId: "price_site",
      customerId: "cus",
      userId: "u1",
      demoId: "d1",
      now,
    });
    expect(params.line_items).toEqual([{ price: "price_site", quantity: 1 }]);
    expect(params.subscription_data?.metadata).toEqual({
      kind: "official_site",
      demo_id: "d1",
      user_id: "u1",
    });
    expect(params.subscription_data?.trial_period_days).toBeUndefined();
    expect(params.payment_method_collection).toBeUndefined();
    expect((params.expires_at as number) - now / 1000).toBeLessThan(24 * 3600);
    expect((params.expires_at as number) - now / 1000).toBeGreaterThanOrEqual(30 * 60);
  });
});

describe("webhook com subscrições de site", () => {
  function sub(overrides: Record<string, unknown> = {}, metadata: Record<string, string> = {}) {
    return {
      id: "sub_site",
      status: "active",
      customer: "cus_1",
      cancel_at_period_end: false,
      trial_start: null,
      trial_end: null,
      metadata: { kind: "official_site", demo_id: "d1", user_id: "u1", ...metadata },
      items: { data: [{ price: { id: "price_site" }, current_period_start: 1, current_period_end: 1_800_000_000 }] },
      ...overrides,
    } as unknown as Stripe.Subscription;
  }
  const event = (type = "customer.subscription.updated", livemode = false) =>
    ({ id: "evt_1", type, livemode, data: { object: { id: "sub_site" } } }) as unknown as Stripe.Event;

  function deps(subscription: Stripe.Subscription, result: "applied" | "duplicate" | "missing" = "applied") {
    return {
      retrieveSubscription: vi.fn(async () => subscription),
      apply: vi.fn(async () => true),
      applyOfficialSite: vi.fn(async () => result),
      onOfficialProblem: vi.fn(async () => {}),
      onStarted: vi.fn(async () => {}),
      onPaymentFailed: vi.fn(async () => {}),
      onUnknownUser: vi.fn(async () => {}),
    };
  }

  it("nunca toca no pack, em nenhum estado", async () => {
    for (const status of ["active", "past_due", "unpaid", "canceled", "incomplete"]) {
      const d = deps(sub({ status }));
      expect(await handleStripeEvent(event(), config, d)).toBe("applied");
      expect(d.apply).not.toHaveBeenCalled();
      expect(d.onStarted).not.toHaveBeenCalled();
      expect(d.applyOfficialSite).toHaveBeenCalledWith(
        expect.objectContaining({ demoId: "d1", userId: "u1", status, subscriptionId: "sub_site" }),
      );
    }
  });

  it("usa o estado atual do Stripe, e não o do evento, fora de ordem", async () => {
    const d = deps(sub({ status: "canceled" }));
    await handleStripeEvent(event("customer.subscription.created"), config, d);
    expect(d.applyOfficialSite).toHaveBeenCalledWith(expect.objectContaining({ status: "canceled" }));
    expect(d.onStarted).not.toHaveBeenCalled();
  });

  it("evento repetido não faz nada a seguir", async () => {
    const d = deps(sub({ status: "past_due" }), "duplicate");
    expect(await handleStripeEvent(event(), config, d)).toBe("duplicate");
    expect(d.onPaymentFailed).not.toHaveBeenCalled();
  });

  it("falha de pagamento fica registada", async () => {
    const d = deps(sub({ status: "past_due" }));
    await handleStripeEvent(event(), config, d);
    expect(d.onPaymentFailed).toHaveBeenCalledWith("u1", "past_due");
  });

  it("pago sem site é assinalado", async () => {
    const d = deps(sub(), "missing");
    await handleStripeEvent(event(), config, d);
    expect(d.onOfficialProblem).toHaveBeenCalledWith("sem site");
  });

  it("preço do site sem marca nunca vai para o pack", async () => {
    const d = deps(sub({ metadata: { user_id: "u1" } }));
    expect(await handleStripeEvent(event(), config, d)).toBe("ignored");
    expect(d.apply).not.toHaveBeenCalled();
    expect(d.applyOfficialSite).not.toHaveBeenCalled();
    expect(d.onOfficialProblem).toHaveBeenCalledWith("dados");
  });

  it("com o preço mudado, não mexe no site nem no pack", async () => {
    const d = deps(sub({ items: { data: [{ price: { id: "price_pe" } }] } }));
    expect(await handleStripeEvent(event(), config, d)).toBe("ignored");
    expect(d.apply).not.toHaveBeenCalled();
    expect(d.applyOfficialSite).not.toHaveBeenCalled();
  });

  it("um evento real é recusado", async () => {
    const d = deps(sub());
    expect(await handleStripeEvent(event(undefined, true), config, d)).toBe("rejected");
    expect(d.applyOfficialSite).not.toHaveBeenCalled();
  });

  it("os packs continuam a usar o caminho antigo", async () => {
    const d = deps(sub({ metadata: { user_id: "u1" }, items: { data: [{ price: { id: "price_pe" }, current_period_start: 1, current_period_end: 2 }] } }));
    expect(await handleStripeEvent(event(), config, d)).toBe("applied");
    expect(d.apply).toHaveBeenCalledOnce();
    expect(d.applyOfficialSite).not.toHaveBeenCalled();
  });
});

describe("estado", () => {
  it("só ativo e em falha de pagamento contam como no ar", () => {
    expect(isLive({ status: "active" })).toBe(true);
    expect(isLive({ status: "past_due" })).toBe(true);
    expect(isLive({ status: "pending" })).toBe(false);
    expect(isLive({ status: "ended" })).toBe(false);
    expect(isLive(null)).toBe(false);
  });
});

describe("texto do freelancer só como texto", () => {
  const evil = '<script>alert(1)</script><img src=x onerror=alert(2)>"\'';
  const demo: PublicDemo = {
    company_name: evil,
    niche: evil,
    locality: evil,
    address: evil,
    phone: "javascript:alert(3)//+351 900",
    template: "classic",
    accent_color: "#0F766E",
    headline: evil,
    intro: evil,
    author_name: evil,
  };
  const html = (official: boolean) =>
    renderToStaticMarkup(
      createElement(DemoView, { demo, official, removalContact: "remover@exemplo.test" }),
    );

  it.each([false, true])("oficial %s: nada vira HTML ativo", (official) => {
    const markup = html(official);
    expect(markup).not.toContain("<script");
    expect(markup).not.toContain("<img");
    expect(markup).toContain("&lt;script&gt;");
    expect(markup).not.toMatch(/href="javascript:/i);
    expect(markup).toContain('href="tel:3+351900"');
    // Só dentro de etiquetas reais: no texto escapado, "onerror=" é inofensivo.
    expect(markup).not.toMatch(/<[^>]*\son\w+=/);
  });

  it("o assunto do pedido de remoção vai codificado", () => {
    expect(html(true)).toContain("mailto:remover@exemplo.test?subject=Pedido%20de%20remo");
    expect(html(true)).not.toMatch(/mailto:[^"]*</);
  });

  it("aviso e rodapé só onde devem estar", () => {
    expect(html(false)).toContain("Proposta não oficial");
    expect(html(false)).not.toContain("Pedir remoção");
    expect(html(true)).not.toContain("Proposta não oficial");
    expect(html(true)).toContain("Pedir remoção deste site");
  });
});

describe("cabeçalhos", () => {
  it("demos e sites têm política de segurança; só as demos têm noindex", async () => {
    const rules = await nextConfig.headers!();
    const of = (source: string) => rules.find((rule) => rule.source === source)!.headers;
    for (const source of ["/demo/:path*", "/s/:path*"]) {
      const csp = of(source).find(({ key }) => key === "Content-Security-Policy")!.value;
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'none'");
      expect(csp).toContain("form-action 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(of(source).find(({ key }) => key === "X-Content-Type-Options")!.value).toBe("nosniff");
    }
    expect(of("/demo/:path*").some(({ key }) => key === "X-Robots-Tag")).toBe(true);
    expect(of("/s/:path*").some(({ key }) => key === "X-Robots-Tag")).toBe(false);
  });
});
