import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import { PLANS } from "@/lib/account/rules";
import {
  LOWEST_LIMITS,
  buildCheckoutParams,
  currencyForLocale,
  hasLiveSubscription,
  limitsFor,
  parseBillingConfig,
  parsePlanId,
  planForPrice,
  type BillingConfig,
} from "./rules";
import { handleStripeEvent, type SubscriptionUpdate } from "./webhook";

const env = {
  STRIPE_SECRET_KEY: "sk_test_abc",
  STRIPE_WEBHOOK_SECRET: "whsec_abc",
  SITE_URL: "https://exemplo.test",
  MARKETS_ENABLED: "PT,BR",
  STRIPE_PRICE_STARTER_EUR: "price_se",
  STRIPE_PRICE_STARTER_BRL: "price_sb",
  STRIPE_PRICE_PRO_EUR: "price_pe",
  STRIPE_PRICE_PRO_BRL: "price_pb",
  STRIPE_PRICE_AGENCY_EUR: "price_ae",
  STRIPE_PRICE_AGENCY_BRL: "price_ab",
};
const config = parseBillingConfig(env) as BillingConfig;

function subscription(overrides: Partial<Stripe.Subscription> = {}) {
  return {
    id: "sub_1",
    status: "active",
    customer: "cus_1",
    metadata: { user_id: "u1" },
    items: {
      data: [
        {
          price: { id: "price_pe" },
          current_period_start: 1_800_000_000,
          current_period_end: 1_802_592_000,
        },
      ],
    },
    trial_start: null,
    trial_end: null,
    cancel_at_period_end: false,
    ...overrides,
  } as unknown as Stripe.Subscription;
}

function event(
  type: string,
  overrides: Partial<Stripe.Event> = {},
  id = "evt_1",
) {
  return {
    id,
    type,
    livemode: false,
    data: { object: { id: "sub_1" } },
    ...overrides,
  } as unknown as Stripe.Event;
}

function deps(current = subscription(), applied = true) {
  return {
    retrieveSubscription: vi.fn(async () => current),
    apply: vi.fn(async (update: SubscriptionUpdate) => {
      void update;
      return applied;
    }),
    applyOfficialSite: vi.fn(async () => "applied" as const),
    onOfficialProblem: vi.fn(async () => {}),
    onStarted: vi.fn(async () => {}),
    onPaymentFailed: vi.fn(async () => {}),
    onUnknownUser: vi.fn(async () => {}),
  };
}

describe("limites do pack", () => {
  it("uma subscrição paga em dia dá os limites do pack", () => {
    for (const plan of PLANS) {
      expect(limitsFor("active", plan.id)).toEqual({
        searches: plan.searches,
        demos: plan.demos,
        lookups: plan.lookups,
        monthlyLookups: plan.monthlyLookups,
      });
    }
  });

  it.each([
    "trialing",
    "past_due",
    "unpaid",
    "canceled",
    "paused",
    "incomplete",
    "incomplete_expired",
    null,
  ])("com o estado %s volta ao limite mais baixo", (status) => {
    expect(limitsFor(status, "agency")).toEqual(LOWEST_LIMITS);
  });

  it("sem subscrição ou com pack desconhecido fica no mais baixo", () => {
    expect(limitsFor(null, null)).toEqual({
      searches: 10,
      demos: 2,
      lookups: 3,
      monthlyLookups: 90,
    });
    expect(limitsFor("active", null)).toEqual(LOWEST_LIMITS);
    expect(limitsFor("active", "outro")).toEqual(LOWEST_LIMITS);
  });

  it("o pagamento recuperado devolve os limites do pack", () => {
    expect(limitsFor("past_due", "pro")).toEqual(LOWEST_LIMITS);
    expect(limitsFor("active", "pro").searches).toBe(150);
  });

  it("subscrição acabada pode voltar a subscrever; com problema de pagamento, não", () => {
    expect(hasLiveSubscription("past_due")).toBe(true);
    expect(hasLiveSubscription("trialing")).toBe(true);
    expect(hasLiveSubscription("canceled")).toBe(false);
    expect(hasLiveSubscription(null)).toBe(false);
  });
});

describe("custo no pior caso", () => {
  // Preços do Google de 30/10/2026, sem a parte grátis. Um dólar conta como um euro.
  const SEARCH_COST = 0.035;
  const LOOKUP_COST = 0.02;

  it.each(PLANS.map((plan) => [plan.id, plan] as const))(
    "%s não passa 30%% do preço em euros",
    (_id, plan) => {
      const cost = plan.searches * SEARCH_COST + plan.monthlyLookups * LOOKUP_COST;
      expect(cost).toBeLessThanOrEqual(plan.price.eur * 0.3);
    },
  );

  it("o teto mensal nunca passa o diário vezes 30 dias", () => {
    PLANS.forEach((plan) =>
      expect(plan.monthlyLookups).toBe(plan.lookups * 30),
    );
  });
});

describe("configuração do Stripe", () => {
  it("lê as chaves de teste e os preços", () => {
    expect(config.prices.pro.brl).toBe("price_pb");
  });

  it("recusa qualquer chave real", () => {
    expect(
      parseBillingConfig({ ...env, STRIPE_SECRET_KEY: "sk_live_abc" }),
    ).toBeNull();
    expect(
      parseBillingConfig({ ...env, STRIPE_SECRET_KEY: "rk_live_abc" }),
    ).toBeNull();
    expect(
      parseBillingConfig({
        ...env,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_abc",
      }),
    ).toBeNull();
  });

  it.each(Object.keys(env).filter((name) => name !== "MARKETS_ENABLED"))(
    "sem %s, os pagamentos ficam desligados",
    (name) => {
      expect(parseBillingConfig({ ...env, [name]: "" })).toBeNull();
    },
  );

  it("só em Portugal, bastam e valem só os preços em euros", () => {
    const onlyEur = {
      STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET,
      SITE_URL: env.SITE_URL,
      STRIPE_PRICE_STARTER_EUR: env.STRIPE_PRICE_STARTER_EUR,
      STRIPE_PRICE_PRO_EUR: env.STRIPE_PRICE_PRO_EUR,
      STRIPE_PRICE_AGENCY_EUR: env.STRIPE_PRICE_AGENCY_EUR,
    };
    expect(parseBillingConfig(onlyEur)?.prices.pro).toEqual({ eur: "price_pe" });

    const ptConfig = parseBillingConfig({ ...env, MARKETS_ENABLED: "PT" }) as BillingConfig;
    expect(ptConfig.prices.pro.brl).toBeUndefined();
    expect(planForPrice(ptConfig, "price_pb")).toBeNull();
    expect(planForPrice(ptConfig, undefined)).toBeNull();
  });

  it("reconhece o pack pelo preço, em qualquer moeda", () => {
    expect(planForPrice(config, "price_ab")).toBe("agency");
    expect(planForPrice(config, "price_outro")).toBeNull();
    expect(planForPrice(config, undefined)).toBeNull();
  });

  it("escolhe a moeda pela língua da conta", () => {
    expect(currencyForLocale("pt-BR", ["PT", "BR"])).toBe("brl");
    expect(currencyForLocale("pt-BR", ["PT"])).toBe("eur");
    expect(currencyForLocale("pt-PT", ["PT", "BR"])).toBe("eur");
    expect(currencyForLocale(null, ["PT", "BR"])).toBe("eur");
  });

  it("só aceita packs que existem", () => {
    expect(parsePlanId("pro")).toBe("pro");
    expect(parsePlanId("gratis")).toBeNull();
  });
});

describe("teste grátis de 7 dias no Checkout", () => {
  const base = {
    config,
    plan: "pro",
    currency: "eur",
    customerId: "cus_1",
    userId: "u1",
  } as const;

  it("não pede cartão e cancela se não for adicionado nenhum", () => {
    const params = buildCheckoutParams({ ...base, trialUsed: false });
    expect(params.payment_method_collection).toBe("if_required");
    expect(params.subscription_data).toEqual({
      metadata: { user_id: "u1" },
      trial_period_days: 7,
      trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
    });
  });

  it("só há um teste por conta: depois pede cartão", () => {
    const params = buildCheckoutParams({ ...base, trialUsed: true });
    expect(params.payment_method_collection).toBeUndefined();
    expect(params.subscription_data).toEqual({ metadata: { user_id: "u1" } });
  });

  it("usa o preço do servidor e volta ao ecrã de planos", () => {
    const params = buildCheckoutParams({
      ...base,
      currency: "brl",
      trialUsed: false,
    });
    expect(params.mode).toBe("subscription");
    expect(params.line_items).toEqual([{ price: "price_pb", quantity: 1 }]);
    expect(params.success_url).toBe(
      "https://exemplo.test/painel/planos?pagamento=sucesso",
    );
  });
});

describe("webhook do Stripe", () => {
  it("usa o estado atual da subscrição, não o que vinha no evento", async () => {
    const d = deps(subscription({ status: "canceled" }));
    const stale = event("customer.subscription.updated", {
      data: { object: { id: "sub_1", status: "active" } },
    } as unknown as Partial<Stripe.Event>);

    expect(await handleStripeEvent(stale, config, d)).toBe("applied");
    expect(d.apply.mock.calls[0][0]).toMatchObject({
      eventId: "evt_1",
      userId: "u1",
      customerId: "cus_1",
      subscriptionId: "sub_1",
      status: "canceled",
      plan: "pro",
    });
  });

  it("um evento repetido não tem efeitos", async () => {
    const d = deps(subscription(), false);
    expect(
      await handleStripeEvent(event("customer.subscription.created"), config, d),
    ).toBe("duplicate");
    expect(d.onStarted).not.toHaveBeenCalled();
  });

  it("regista o início da subscrição", async () => {
    const d = deps();
    await handleStripeEvent(event("customer.subscription.created"), config, d);
    expect(d.onStarted).toHaveBeenCalledWith("u1", "pro");
  });

  it.each(["past_due", "unpaid"] as const)(
    "pagamento falhado (%s) fica registado",
    async (status) => {
      const d = deps(subscription({ status }));
      await handleStripeEvent(event("customer.subscription.updated"), config, d);
      expect(d.onPaymentFailed).toHaveBeenCalledWith("u1", status);
      expect(limitsFor(d.apply.mock.calls[0][0].status, "pro")).toEqual(
        LOWEST_LIMITS,
      );
    },
  );

  it("subscrição acabada baixa ao limite mais baixo", async () => {
    const d = deps(subscription({ status: "canceled" }));
    await handleStripeEvent(event("customer.subscription.deleted"), config, d);
    const update = d.apply.mock.calls[0][0];
    expect(limitsFor(update.status, update.plan)).toEqual(LOWEST_LIMITS);
  });

  it("regista quem já usou o teste e quando acaba", async () => {
    const d = deps(
      subscription({ status: "trialing", trial_start: 1, trial_end: 1_800_000_000 }),
    );
    await handleStripeEvent(event("customer.subscription.created"), config, d);
    expect(d.apply.mock.calls[0][0]).toMatchObject({
      hadTrial: true,
      trialEnd: "2027-01-15T08:00:00.000Z",
    });
  });

  it("guarda o período atual, porque é nele que o consumo renova", async () => {
    const d = deps();
    await handleStripeEvent(event("customer.subscription.updated"), config, d);
    expect(d.apply.mock.calls[0][0]).toMatchObject({
      periodStart: "2027-01-15T08:00:00.000Z",
      periodEnd: "2027-02-14T08:00:00.000Z",
    });
  });

  it("recusa eventos reais e ignora os tipos que não usa", async () => {
    const d = deps();
    expect(
      await handleStripeEvent(
        event("customer.subscription.updated", { livemode: true }),
        config,
        d,
      ),
    ).toBe("rejected");
    expect(await handleStripeEvent(event("invoice.created"), config, d)).toBe(
      "ignored",
    );
    expect(d.apply).not.toHaveBeenCalled();
    expect(d.retrieveSubscription).not.toHaveBeenCalled();
  });

  it("sem utilizador associado, avisa e não grava", async () => {
    const d = deps(subscription({ metadata: {} }));
    expect(
      await handleStripeEvent(event("customer.subscription.updated"), config, d),
    ).toBe("ignored");
    expect(d.onUnknownUser).toHaveBeenCalled();
    expect(d.apply).not.toHaveBeenCalled();
  });

  it("um erro sobe, para o Stripe voltar a tentar", async () => {
    const d = deps();
    d.apply.mockRejectedValueOnce(new Error("base de dados"));
    await expect(
      handleStripeEvent(event("customer.subscription.updated"), config, d),
    ).rejects.toThrow();
  });

  it("a assinatura rejeita pedidos alterados", () => {
    const stripe = new Stripe("sk_test_abc");
    const payload = JSON.stringify({ id: "evt_1", object: "event" });
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: "whsec_abc",
    });

    expect(
      stripe.webhooks.constructEvent(payload, header, "whsec_abc").id,
    ).toBe("evt_1");
    expect(() =>
      stripe.webhooks.constructEvent(`${payload} `, header, "whsec_abc"),
    ).toThrow();
    expect(() =>
      stripe.webhooks.constructEvent(payload, "t=1,v1=falsa", "whsec_abc"),
    ).toThrow();
  });
});
