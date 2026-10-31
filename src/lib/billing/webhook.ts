import type Stripe from "stripe";
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

  const plan = planForPrice(config, subscription.items.data[0]?.price.id);
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
    trialEnd: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
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
