"use server";

import { redirect } from "next/navigation";
import { reportError } from "@/lib/events/log";
import { enabledMarkets } from "@/lib/markets";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  buildCheckoutParams,
  currencyForLocale,
  hasLiveSubscription,
  parsePlanId,
} from "./rules";
import { ensureStripeCustomer } from "./customer";
import { getBilling } from "./stripe";

const PLANS_PATH = "/painel/planos";
const FAILED_PATH = `${PLANS_PATH}?pagamento=erro`;

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  return { supabase, user };
}

// O plano vem do formulário, mas o preço e o utilizador são sempre do servidor.
export async function startCheckout(planValue: unknown) {
  const plan = parsePlanId(planValue);
  const billing = getBilling();
  if (!plan || !billing) redirect(FAILED_PATH);

  const { supabase, user } = await currentUser();
  const { config, stripe } = billing;
  let url: string | null = null;

  try {
    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("subscriptions")
      .select("stripe_customer_id, status, trial_used")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw new Error(error.code);

    // Já tem subscrição: muda de pack no portal, para não pagar duas.
    if (row && hasLiveSubscription(row.status)) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: row.stripe_customer_id,
        return_url: new URL(PLANS_PATH, config.siteUrl).toString(),
      });
      url = portal.url;
    } else {
      const customerId = await ensureStripeCustomer(
        admin,
        stripe,
        user,
        row?.stripe_customer_id,
      );

      const { data: profile } = await supabase
        .from("profiles")
        .select("locale")
        .eq("id", user.id)
        .maybeSingle();

      const session = await stripe.checkout.sessions.create(
        buildCheckoutParams({
          config,
          plan,
          currency: currencyForLocale(profile?.locale, enabledMarkets()),
          customerId,
          userId: user.id,
          trialUsed: row?.trial_used ?? false,
        }),
      );
      url = session.url;
    }
  } catch (error) {
    await reportError(
      "pagamentos checkout",
      error instanceof Error ? error.name : undefined,
      user.id,
    );
  }

  redirect(url ?? FAILED_PATH);
}

export async function openBillingPortal() {
  const billing = getBilling();
  if (!billing) redirect(FAILED_PATH);

  const { user } = await currentUser();
  let url: string | null = null;

  try {
    const { data: row } = await createAdminClient()
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (row) {
      const portal = await billing.stripe.billingPortal.sessions.create({
        customer: row.stripe_customer_id,
        return_url: new URL(PLANS_PATH, billing.config.siteUrl).toString(),
      });
      url = portal.url;
    }
  } catch (error) {
    await reportError(
      "pagamentos portal",
      error instanceof Error ? error.name : undefined,
      user.id,
    );
  }

  redirect(url ?? FAILED_PATH);
}
