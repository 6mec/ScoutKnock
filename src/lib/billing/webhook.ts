import type Stripe from "stripe";
import { OFFICIAL_SITE_METADATA_KIND } from "@/lib/demos/official-rules";
import { isPaymentProblem, planForPrice, type BillingConfig } from "./rules";

const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export type SubscriptionUpdate = {
  eventId: string;
  eventType: string;
  userId: string;
  customerId: string;
  subscriptionId: string;
  status: string;
  plan: string | null;
  hadTrial: boolean;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  periodStart: string | null;
  periodEnd: string | null;
};

function toIso(seconds?: number | null) {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

export type OfficialSiteUpdate = {
  eventId: string;
  eventType: string;
  demoId: string;
  userId: string;
  subscriptionId: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  periodEnd: string | null;
};

export type WebhookResult = "applied" | "duplicate" | "ignored" | "rejected";

// Falhar aqui lança erro: a rota responde 500 e o Stripe volta a tentar.
export async function handleStripeEvent(
  event: Stripe.Event,
  config: BillingConfig,
  deps: {
    // Os eventos podem chegar fora de ordem: conta sempre o estado atual.
    retrieveSubscription: (id: string) => Promise<Stripe.Subscription>;
    apply: (update: SubscriptionUpdate) => Promise<boolean>;
    applyOfficialSite: (
      update: OfficialSiteUpdate,
    ) => Promise<"applied" | "duplicate" | "missing">;
    onOfficialProblem: (reason: "dados" | "preço" | "sem site") => Promise<void>;
    onStarted: (userId: string, plan: string | null) => Promise<void>;
    onPaymentFailed: (userId: string, status: string) => Promise<void>;
    onUnknownUser: () => Promise<void>;
  },
): Promise<WebhookResult> {
  // Esta versão só trabalha em modo de teste.
  if (event.livemode) return "rejected";
  if (!SUBSCRIPTION_EVENTS.has(event.type)) return "ignored";

  const { id } = event.data.object as Stripe.Subscription;
  const subscription = await deps.retrieveSubscription(id);
  const userId = subscription.metadata.user_id;

  if (!userId) {
    await deps.onUnknownUser();
    return "ignored";
  }

  const item = subscription.items.data[0];

  // Uma subscrição de site nunca toca nos packs: substituiria o estado do pack.
  if (
    subscription.metadata.kind === OFFICIAL_SITE_METADATA_KIND ||
    (config.officialSite && item?.price.id === config.officialSite.priceId)
  ) {
    const demoId = subscription.metadata.demo_id;
    if (subscription.metadata.kind !== OFFICIAL_SITE_METADATA_KIND || !demoId) {
      await deps.onOfficialProblem("dados");
      return "ignored";
    }
    // Com o preço mudado, por exemplo no portal, já não é o site de 5 €.
    if (config.officialSite && item?.price.id !== config.officialSite.priceId) {
      await deps.onOfficialProblem("preço");
      return "ignored";
    }

    const result = await deps.applyOfficialSite({
      eventId: event.id,
      eventType: event.type,
      demoId,
      userId,
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      periodEnd: toIso(item?.current_period_end),
    });

    if (result === "duplicate") return "duplicate";
    if (result === "missing") await deps.onOfficialProblem("sem site");
    if (isPaymentProblem(subscription.status)) {
      await deps.onPaymentFailed(userId, subscription.status);
    }
    return "applied";
  }

  const plan = planForPrice(config, item?.price.id);
  const applied = await deps.apply({
    eventId: event.id,
    eventType: event.type,
    userId,
    customerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
    subscriptionId: subscription.id,
    status: subscription.status,
    plan,
    hadTrial: subscription.trial_start !== null,
    trialEnd: toIso(subscription.trial_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    periodStart: toIso(item?.current_period_start),
    periodEnd: toIso(item?.current_period_end),
  });

  if (!applied) return "duplicate";

  if (event.type === "customer.subscription.created") {
    await deps.onStarted(userId, plan);
  }
  if (isPaymentProblem(subscription.status)) {
    await deps.onPaymentFailed(userId, subscription.status);
  }

  return "applied";
}
