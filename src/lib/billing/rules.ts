import type Stripe from "stripe";
import { PLANS } from "@/lib/account/rules";
import { parseMarkets, type Market } from "@/lib/markets";

export type PlanId = (typeof PLANS)[number]["id"];
export type Currency = "eur" | "brl";

export const TRIAL_DAYS = 7;
// O limite mais baixo do docs/plano.md. Tem de bater certo com a base de dados.
export const LOWEST_LIMITS = { searches: 10, demos: 2, lookups: 3, monthlyLookups: 90 };

export type BillingConfig = {
  secretKey: string;
  webhookSecret: string;
  siteUrl: string;
  prices: Record<PlanId, { eur: string; brl?: string }>;
};

// Só uma subscrição paga em dia dá os limites do pack. Teste, pagamento falhado,
// subscrição acabada ou conta sem subscrição ficam no limite mais baixo.
export function limitsFor(status: string | null, plan: string | null) {
  const found = PLANS.find((item) => item.id === plan);

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
    prices[id] = withBrazil ? { eur, brl } : { eur };
  }

  return { secretKey, webhookSecret, siteUrl, prices };
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
}: {
  config: BillingConfig;
  plan: PlanId;
  currency: Currency;
  customerId: string;
  userId: string;
  trialUsed: boolean;
}): Stripe.Checkout.SessionCreateParams {
  const returnUrl = new URL("/painel/planos", config.siteUrl);

  return {
    mode: "subscription",
    customer: customerId,
    line_items: [
      { price: config.prices[plan][currency] ?? config.prices[plan].eur, quantity: 1 },
    ],
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
