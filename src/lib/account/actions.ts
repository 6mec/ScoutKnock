"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getBilling } from "@/lib/billing/stripe";
import { reportError } from "@/lib/events/log";
import { parseAuthorName } from "@/lib/demos/rules";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isDeleteConfirmed } from "./rules";

type Result = { ok: boolean; rateLimited?: boolean };

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  return { supabase, user };
}

export async function saveDisplayName(value: unknown): Promise<Result> {
  const name = parseAuthorName(value);
  if (!name) return { ok: false };

  const { supabase, user } = await currentUser();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: name })
    .eq("id", user.id);

  if (error) {
    await reportError("conta nome", error.code, user.id);
    return { ok: false };
  }

  revalidatePath("/painel/conta");
  return { ok: true };
}

export async function sendPasswordEmail(): Promise<Result> {
  const { supabase, user } = await currentUser();
  const { error } = await supabase.auth.resetPasswordForEmail(user.email ?? "");

  if (error) {
    await reportError("conta palavra-passe", error.code ?? error.status, user.id);
    return { ok: false, rateLimited: error.status === 429 };
  }

  return { ok: true };
}

// Apagar o utilizador apaga em cascata o perfil, as demos e os contactos.
export async function deleteAccount(confirmation: unknown): Promise<Result> {
  if (!isDeleteConfirmed(confirmation)) return { ok: false };

  const { supabase, user } = await currentUser();

  try {
    const admin = createAdminClient();

    // Primeiro o Stripe: uma conta apagada nunca pode continuar a ser cobrada.
    // Apagar o cliente cancela logo as subscrições dele.
    const { data: subscription, error: readError } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    // Sem saber se há subscrição, não se apaga: podia ficar a cobrar.
    if (readError) {
      await reportError("conta apagar", readError.code, user.id);
      return { ok: false };
    }
    if (subscription) {
      const billing = getBilling();
      if (!billing) {
        await reportError("conta apagar", "sem stripe", user.id);
        return { ok: false };
      }
      await billing.stripe.customers.del(subscription.stripe_customer_id);
    }

    const { error } = await admin.auth.admin.deleteUser(user.id);

    if (error) {
      await reportError("conta apagar", error.code ?? error.status, user.id);
      return { ok: false };
    }
  } catch {
    await reportError("conta apagar", "sem cliente ou stripe", user.id);
    return { ok: false };
  }

  // A conta já não existe: só falta limpar os cookies neste browser.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
