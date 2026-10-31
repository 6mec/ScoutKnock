"use server";

import { ptPT } from "@/i18n/pt-PT";
import { reportError } from "@/lib/events/log";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWaitlistEmailConfig, sendConfirmationEmail } from "./email";
import {
  CONSENT_VERSION,
  DAILY_EMAIL_LIMIT,
  canResendEmail,
  isValidWaitlistEmail,
  normalizeEmail,
  parseService,
} from "./rules";
import { verifyToken, type TokenPurpose } from "./tokens";

export type WaitlistState = {
  status: "idle" | "error" | "success";
  message?: string;
  // Só em dev com o envio real desligado: ver buildConfirmationEmail.
  devConfirmPath?: string;
};

const { messages, confirm, leave } = ptPT.waitlist;

const joined: WaitlistState = { status: "success", message: messages.success };

function joinedWith(devConfirmPath: string | null): WaitlistState {
  return devConfirmPath ? { ...joined, devConfirmPath } : joined;
}

function failure(message: string): WaitlistState {
  return { status: "error", message };
}

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function joinWaitlist(
  _state: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  // Campo invisível: só um bot o preenche, e recebe a resposta normal.
  if (field(formData, "website")) return joined;

  const email = normalizeEmail(field(formData, "email"));
  if (!isValidWaitlistEmail(email)) return failure(messages.invalidEmail);

  const config = getWaitlistEmailConfig();
  if (!config) return failure(messages.closed);

  const supabase = createAdminClient();
  const now = Date.now();

  const { count, error: countError } = await supabase
    .from("waitlist")
    .select("id", { count: "exact", head: true })
    .gte("last_email_sent_at", new Date(now - 86_400_000).toISOString());

  if (countError || (count ?? 0) >= DAILY_EMAIL_LIMIT) {
    await reportError("waitlist limite", countError?.code ?? "atingido");
    return failure(messages.generic);
  }

  const { data: existing, error: readError } = await supabase
    .from("waitlist")
    .select("id, status, last_email_sent_at")
    .eq("email", email)
    .maybeSingle();

  if (readError) {
    await reportError("waitlist leitura", readError.code);
    return failure(messages.generic);
  }

  // A resposta é sempre igual, para não revelar quem está na lista.
  if (existing) {
    if (
      existing.status === "confirmed" ||
      !canResendEmail(existing.last_email_sent_at, now)
    ) {
      return joined;
    }

    const sent = await sendConfirmationEmail(config, existing.id, email);
    if (!sent.ok) return failure(messages.generic);

    await supabase
      .from("waitlist")
      .update({ last_email_sent_at: new Date(now).toISOString() })
      .eq("id", existing.id);

    return joinedWith(sent.devConfirmPath);
  }

  const { data: created, error: insertError } = await supabase
    .from("waitlist")
    .insert({
      email,
      service: parseService(field(formData, "service")),
      consent_version: CONSENT_VERSION,
    })
    .select("id")
    .single();

  if (insertError) {
    // Dois pedidos ao mesmo tempo com o mesmo email.
    if (insertError.code === "23505") return joined;
    await reportError("waitlist inserção", insertError.code);
    return failure(messages.generic);
  }

  const sent = await sendConfirmationEmail(config, created.id, email);
  if (!sent.ok) {
    await supabase.from("waitlist").delete().eq("id", created.id);
    return failure(messages.generic);
  }

  return joinedWith(sent.devConfirmPath);
}

function hasValidToken(purpose: TokenPurpose, formData: FormData) {
  const secret = process.env.WAITLIST_TOKEN_SECRET;
  const id = field(formData, "id");
  const token = field(formData, "token");

  return Boolean(secret && id && verifyToken(secret, purpose, id, token));
}

export async function confirmWaitlist(
  _state: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  if (!hasValidToken("confirm", formData)) return failure(confirm.invalid);

  const supabase = createAdminClient();
  const id = field(formData, "id");

  const { data: entry, error } = await supabase
    .from("waitlist")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (error) return failure(messages.generic);
  if (!entry) return failure(confirm.invalid);

  if (entry.status === "pending") {
    const { error: updateError } = await supabase
      .from("waitlist")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) return failure(messages.generic);
  }

  return { status: "success", message: confirm.success };
}

export async function leaveWaitlist(
  _state: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  if (!hasValidToken("unsubscribe", formData)) return failure(leave.invalid);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("waitlist")
    .delete()
    .eq("id", field(formData, "id"));

  if (error) return failure(messages.generic);

  return { status: "success", message: leave.success };
}
