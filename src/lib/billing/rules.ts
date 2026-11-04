import type Stripe from "stripe";
import { ADMIN_LIMITS, PLANS, YEARLY_PRICES_EUR } from "@/lib/account/rules";
import {
  OFFICIAL_SITE_METADATA_KIND,
  parseRemovalContact,
} from "@/lib/demos/official-rules";
import { parseMarkets, type Market } from "@/lib/markets";

const OFFICIAL_CHECKOUT_MINUTES = 120;

export type PlanId = (typeof PLANS)[number]["id"];
export type Currency = "eur" | "brl";
export type BillingInterval = "month" | "year";

export const TRIAL_DAYS = 7;
// O limite mais baixo do docs/plano.md. Tem de bater certo com a base de dados.
export const LOWEST_LIMITS = { searches: 10, demos: 2, lookups: 3, monthlyLookups: 90 };

export type BillingConfig = {
  secretKey: string;
  webhookSecret: string;
  siteUrl: string;
  // O preço anual é opcional e só em euros: sem ele, só há pack mensal.
  prices: Record<PlanId, { eur: string; brl?: string; eurYearly?: string }>;
  // Sem preço ou contacto de remoção, só a publicação fica desligada.
  officialSite: { priceId: string; removalContact: string } | null;
};

// Só uma subscrição paga em dia dá os limites do pack. Teste, pagamento falhado,
// subscrição acabada ou conta sem subscrição ficam no limite mais baixo.
export function limitsFor(
  status: string | null,
  plan: string | null,
  isAdmin = false,
) {
  const found = PLANS.find((item) => item.id === plan);

  if (isAdmin) return ADMIN_LIMITS;

  return status === "active" && found
    ? {
        searches: found.searches,
        demos: found.demos,
        lookups: found.lookups,
        monthlyLookups: found.monthlyLookups,
      }
    : LOWEST_LIMITS;
}

export function isPaymentProblem(status: string | null) {
  return status === "past_due" || status === "unpaid";
}

// Ainda ligada a um pack: não pode criar outra subscrição por cima.
export function hasLiveSubscription(status: string | null) {
  return status === "active" || status === "trialing" || isPaymentProblem(status);
}

// Esta versão só trabalha em modo de teste: uma chave real desliga os pagamentos.
export function parseBillingConfig(
  env: Record<string, string | undefined>,
): BillingConfig | null {
  const secretKey = env.STRIPE_SECRET_KEY;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  const siteUrl = env.SITE_URL;

  if (
    !secretKey?.startsWith("sk_test_") ||
    !webhookSecret?.startsWith("whsec_") ||
    !siteUrl ||
    env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_live_")
  ) {
    return null;
  }

  // Os preços em reais só são precisos com o Brasil ligado.
  const withBrazil = parseMarkets(env.MARKETS_ENABLED).includes("BR");
  const prices = {} as BillingConfig["prices"];
  for (const { id } of PLANS) {
    const eur = env[`STRIPE_PRICE_${id.toUpperCase()}_EUR`];
    const brl = env[`STRIPE_PRICE_${id.toUpperCase()}_BRL`];
    if (!eur?.startsWith("price_")) return null;
    if (withBrazil && !brl?.startsWith("price_")) return null;
    const eurYearly = env[`STRIPE_PRICE_${id.toUpperCase()}_EUR_YEARLY`];
    prices[id] = {
      eur,
      ...(withBrazil ? { brl } : {}),
      ...(eurYearly?.startsWith("price_") ? { eurYearly } : {}),
    };
  }

  const priceId = env.STRIPE_PRICE_OFFICIAL_SITE_EUR;
  const removalContact = parseRemovalContact(env.OFFICIAL_SITE_REMOVAL_CONTACT);

  return {
    secretKey,
    webhookSecret,
    siteUrl,
    prices,
    officialSite:
      priceId?.startsWith("price_") && removalContact
        ? { priceId, removalContact }
        : null,
  };
}

// Sem teste grátis. Cada site tem a sua subscrição, e a marca nunca vem do browser.
export function buildOfficialCheckoutParams({
  config,
  priceId,
  customerId,
  userId,
  demoId,
  now = Date.now(),
}: {
  config: BillingConfig;
  priceId: string;
  customerId: string;
  userId: string;
  demoId: string;
  now?: number;
}): Stripe.Checkout.SessionCreateParams {
  const returnUrl = new URL(`/painel/demos/${demoId}`, config.siteUrl);

  return {
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${returnUrl}?publicacao=sucesso`,
    cancel_url: returnUrl.toString(),
    // Acaba antes da reserva do nome, para um pagamento nunca ficar sem site.
    expires_at: Math.floor(now / 1000) + OFFICIAL_CHECKOUT_MINUTES * 60,
    subscription_data: {
      metadata: {
        kind: OFFICIAL_SITE_METADATA_KIND,
        demo_id: demoId,
        user_id: userId,
      },
    },
  };
}

// O separador "Anual" só aparece com o preço decidido e criado no Stripe, em todos os packs.
export function yearlyAvailable(config: BillingConfig | null) {
  return Boolean(
    config &&
      PLANS.every(({ id }) => config.prices[id].eurYearly && YEARLY_PRICES_EUR[id] !== null),
  );
}

export function parseInterval(value: unknown): BillingInterval {
  return value === "year" ? "year" : "month";
}

// Nomes das variáveis que faltam para os pagamentos ligarem, para o admin ver o que
// falta. Só os nomes: os valores nunca saem do servidor.
export function missingBillingEnv(env: Record<string, string | undefined>) {
  const missing: string[] = [];
  if (!env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) missing.push("STRIPE_SECRET_KEY");
  if (!env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_")) missing.push("STRIPE_WEBHOOK_SECRET");
  if (!env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_")) {
    missing.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  }
  if (!env.SITE_URL) missing.push("SITE_URL");
  for (const { id } of PLANS) {
    const name = `STRIPE_PRICE_${id.toUpperCase()}_EUR`;
    if (!env[name]?.startsWith("price_")) missing.push(name);
  }
  return missing;
}

export function planForPrice(config: BillingConfig, priceId?: string) {
  if (!priceId) return null;

  return (
    PLANS.find(({ id }) => Object.values(config.prices[id]).includes(priceId))?.id ??
    null
  );
}

export function parsePlanId(value: unknown): PlanId | null {
  return PLANS.find(({ id }) => id === value)?.id ?? null;
}

export function currencyForLocale(
  locale: string | null | undefined,
  markets: Market[],
): Currency {
  return locale === "pt-BR" && markets.includes("BR") ? "brl" : "eur";
}

// O teste não pede cartão e cancela sozinho se não for adicionado nenhum até ao
// fim. Só há um teste por conta: depois disso, o Checkout pede cartão.
export function buildCheckoutParams({
  config,
  plan,
  currency,
  customerId,
  userId,
  trialUsed,
  interval = "month",
}: {
  config: BillingConfig;
  plan: PlanId;
  currency: Currency;
  customerId: string;
  userId: string;
  trialUsed: boolean;
  interval?: BillingInterval;
}): Stripe.Checkout.SessionCreateParams {
  const returnUrl = new URL("/painel/planos", config.siteUrl);
  const prices = config.prices[plan];
  // O anual é só em euros. Sem preço anual, nunca cai em silêncio no mensal.
  const price =
    interval === "year" ? prices.eurYearly : (prices[currency] ?? prices.eur);
  if (!price) throw new Error("sem preço anual");

  return {
    mode: "subscription",
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    success_url: `${returnUrl}?pagamento=sucesso`,
    cancel_url: returnUrl.toString(),
    subscription_data: {
      metadata: { user_id: userId },
      ...(trialUsed
        ? {}
        : {
            trial_period_days: TRIAL_DAYS,
            trial_settings: {
              end_behavior: { missing_payment_method: "cancel" as const },
            },
          }),
    },
    ...(trialUsed ? {} : { payment_method_collection: "if_required" as const }),
  };
}
