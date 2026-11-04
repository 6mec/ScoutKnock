"use server";

import { redirect } from "next/navigation";
import { ptPT } from "@/i18n/pt-PT";
import { reportError } from "@/lib/events/log";
import { signupsOpen } from "@/lib/personal-mode";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail, isValidPassword } from "./validation";

export type AuthFormState = {
  status: "idle" | "error" | "success";
  message?: string;
};

const { errors, success } = ptPT.auth;

function failure(message: string): AuthFormState {
  return { status: "error", message };
}

// Regista só o código, sem dados do utilizador, e distingue o limite de pedidos.
async function unexpectedFailure(
  action: string,
  error: { code?: string; status?: number },
) {
  await reportError(`auth ${action}`, error.code ?? error.status);
  return failure(error.status === 429 ? errors.rateLimited : errors.generic);
}

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function signUp(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  // Modo pessoal: nenhuma conta nova, mesmo que alguém chame a ação diretamente.
  if (!signupsOpen()) return failure(errors.signupsClosed);

  const email = field(formData, "email").trim();
  const password = field(formData, "password");

  if (!isValidEmail(email)) return failure(errors.invalidEmail);
  if (!isValidPassword(password)) return failure(errors.shortPassword);

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  // Resposta igual se a conta já existir, para não revelar quem está registado.
  if (error && error.code !== "user_already_exists") {
    if (error.code === "weak_password") return failure(errors.shortPassword);
    return unexpectedFailure("signUp", error);
  }

  return { status: "success", message: success.signUp };
}

export async function signIn(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = field(formData, "email").trim();
  const password = field(formData, "password");

  if (!isValidEmail(email) || !password) {
    return failure(errors.invalidCredentials);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "invalid_credentials") {
      return failure(errors.invalidCredentials);
    }
    if (error.code === "email_not_confirmed") {
      return failure(errors.emailNotConfirmed);
    }
    return unexpectedFailure("signIn", error);
  }

  redirect("/painel");
}

export async function requestPasswordReset(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = field(formData, "email").trim();

  if (!isValidEmail(email)) return failure(errors.invalidEmail);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) return unexpectedFailure("requestPasswordReset", error);

  return { status: "success", message: success.reset };
}

export async function updatePassword(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = field(formData, "password");

  if (!isValidPassword(password)) return failure(errors.shortPassword);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    if (error.code === "same_password") return failure(errors.samePassword);
    if (error.code === "weak_password") return failure(errors.shortPassword);
    return unexpectedFailure("updatePassword", error);
  }

  redirect("/painel");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}
