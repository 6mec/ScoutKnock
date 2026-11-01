import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// O mesmo cliente do Stripe para os packs e para os sites.
export async function ensureStripeCustomer(
  admin: SupabaseClient,
  stripe: Stripe,
  user: { id: string; email?: string },
  existingId?: string,
) {
  if (existingId) return existingId;

  const customer = await stripe.customers.create(
    { email: user.email, metadata: { user_id: user.id } },
    { idempotencyKey: `customer-${user.id}` },
  );

  const { error } = await admin
    .from("subscriptions")
    .insert({ user_id: user.id, stripe_customer_id: customer.id });
  if (error) throw new Error(error.code);

  return customer.id;
}
