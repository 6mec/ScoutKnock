import type Stripe from "stripe";
import { handleStripeEvent } from "@/lib/billing/webhook";
import { getBilling } from "@/lib/billing/stripe";
import { logEvent, reportError } from "@/lib/events/log";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const billing = getBilling();
  if (!billing) return new Response(null, { status: 404 });

  const { config, stripe } = billing;
  const signature = request.headers.get("stripe-signature");
  // A assinatura é calculada sobre o texto exato do pedido.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature ?? "",
      config.webhookSecret,
    );
  } catch {
    return new Response(null, { status: 400 });
  }

  try {
    const result = await handleStripeEvent(event, config, {
      retrieveSubscription: (id) => stripe.subscriptions.retrieve(id),
      apply: async (update) => {
        const { data, error } = await createAdminClient().rpc(
          "apply_stripe_subscription_event",
          {
            event_id: update.eventId,
            event_type: update.eventType,
            target_user: update.userId,
            customer_id: update.customerId,
            subscription_id: update.subscriptionId,
            new_status: update.status,
            new_plan: update.plan,
            had_trial: update.hadTrial,
            new_trial_end: update.trialEnd,
            new_cancel_at_period_end: update.cancelAtPeriodEnd,
          },
        );
        if (error) throw new Error(error.code);
        return data === true;
      },
      onStarted: (userId, plan) =>
        logEvent({ type: "subscription_started", data: { plan: plan ?? "" } }, userId),
      onPaymentFailed: (userId, status) =>
        logEvent({ type: "payment_failed", data: { status } }, userId),
      onUnknownUser: () => reportError("stripe webhook", "sem utilizador"),
    });

    return new Response(null, { status: result === "rejected" ? 400 : 200 });
  } catch (error) {
    await reportError(
      "stripe webhook",
      error instanceof Error ? error.message : undefined,
    );
    return new Response(null, { status: 500 });
  }
}
