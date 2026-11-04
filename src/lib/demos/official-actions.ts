"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureStripeCustomer } from "@/lib/billing/customer";
import { buildOfficialCheckoutParams } from "@/lib/billing/rules";
import { getBilling } from "@/lib/billing/stripe";
import { reportError } from "@/lib/events/log";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parseSiteName } from "./official-rules";

export type PublishResult =
  | { status: "checkout"; url: string }
  | { status: "taken" | "invalid" | "unavailable" | "error" };

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  return { supabase, user };
}

// A função da base de dados confirma que a demo é de quem pede, e grava a confirmação.
export async function startOfficialCheckout(
  demoId: string,
  nameValue: unknown,
  confirmed: unknown,
): Promise<PublishResult> {
  const name = parseSiteName(nameValue);
  if (!name || confirmed !== true) return { status: "invalid" };

  const billing = getBilling();
  if (!billing?.config.officialSite) return { status: "unavailable" };

  const { supabase, user } = await currentUser();
  const { data: reserved, error: reserveError } = await supabase.rpc(
    "reserve_official_site",
    { target_demo: demoId, wanted_name: name, confirmed: true },
  );

  if (reserveError) {
    await reportError("site oficial reservar", reserveError.code, user.id);
    return { status: "error" };
  }
  if (reserved === "taken") return { status: "taken" };
  if (reserved !== "ok") return { status: "invalid" };

  try {
    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw new Error(error.code);

    const customerId = await ensureStripeCustomer(
      admin,
      billing.stripe,
      user,
      row?.stripe_customer_id,
    );
    const session = await billing.stripe.checkout.sessions.create(
      buildOfficialCheckoutParams({
        config: billing.config,
        priceId: billing.config.officialSite.priceId,
        customerId,
        userId: user.id,
        demoId,
      }),
    );

    if (session.url) return { status: "checkout", url: session.url };
  } catch (error) {
    await reportError(
      "site oficial checkout",
      error instanceof Error ? error.name : undefined,
      user.id,
    );
  }

  return { status: "error" };
}

// Só muda a subscrição: o estado do site muda quando o evento do Stripe chegar.
export async function setOfficialSiteCancel(
  demoId: string,
  cancel: boolean,
): Promise<{ ok: boolean }> {
  const billing = getBilling();
  if (!billing) return { ok: false };

  const { user } = await currentUser();

  try {
    // O utilizador vem da sessão, por isso só encontra o próprio site.
    const { data: site, error } = await createAdminClient()
      .from("official_sites")
      .select("stripe_subscription_id")
      .eq("demo_id", demoId)
      .eq("user_id", user.id)
      .in("status", ["active", "past_due"])
      .maybeSingle();
    if (error) throw new Error(error.code);
    if (!site?.stripe_subscription_id) return { ok: false };

    await billing.stripe.subscriptions.update(site.stripe_subscription_id, {
      cancel_at_period_end: cancel,
    });
  } catch (error) {
    await reportError(
      "site oficial cancelar",
      error instanceof Error ? error.name : undefined,
      user.id,
    );
    return { ok: false };
  }

  revalidatePath(`/painel/demos/${demoId}`);
  return { ok: true };
}

// Modo pessoal: o admin publica o site do cliente sem o Stripe e cobra por fora.
// A base de dados confirma que é admin, que a demo é dele e que o nome está livre.
export async function publishOfficialSiteDirectly(
  demoId: string,
  nameValue: unknown,
  confirmed: unknown,
): Promise<{ status: "published" | "taken" | "invalid" | "forbidden" | "error" }> {
  const name = parseSiteName(nameValue);
  if (!name || confirmed !== true) return { status: "invalid" };

  const { supabase, user } = await currentUser();
  const { data, error } = await supabase.rpc("publish_official_site_directly", {
    target_demo: demoId,
    wanted_name: name,
    confirmed: true,
  });

  if (error) {
    await reportError("site oficial publicar direto", error.code, user.id);
    return { status: "error" };
  }
  if (data === "taken") return { status: "taken" };
  if (data === "forbidden") return { status: "forbidden" };
  if (data !== "ok") return { status: "invalid" };

  revalidatePath(`/painel/demos/${demoId}`);
  return { status: "published" };
}

export async function unpublishOfficialSiteDirectly(demoId: string): Promise<{ ok: boolean }> {
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase.rpc("unpublish_official_site_directly", {
    target_demo: demoId,
  });

  if (error) await reportError("site oficial tirar do ar", error.code, user.id);
  revalidatePath(`/painel/demos/${demoId}`);
  return { ok: !error && data === true };
}
