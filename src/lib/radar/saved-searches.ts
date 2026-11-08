"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { reportError } from "@/lib/events/log";
import { createClient } from "@/lib/supabase/server";
import { SERVICE_IDS } from "./types";

// Pesquisas guardadas do Radar: só o que a pessoa escreveu (serviço, nicho e localidade).

export type SavedSearch = { id: string; service: string; niche: string; locality: string; created_at: string };

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  return { supabase, user };
}

const text = (value: unknown, max: number) => (typeof value === "string" && value.trim() && value.trim().length <= max ? value.trim() : null);

export async function saveSearch(value: unknown): Promise<{ ok: true; search: SavedSearch } | { ok: false }> {
  const raw = (value ?? {}) as Record<string, unknown>;
  const service = SERVICE_IDS.find((id) => id === raw.service);
  const niche = text(raw.niche, 80);
  const locality = text(raw.locality, 80);
  if (!service || !niche || !locality) return { ok: false };
  const { supabase, user } = await currentUser();
  let { data, error } = await supabase
    .from("saved_searches")
    .insert({ service, niche, locality })
    .select("id, service, niche, locality, created_at")
    .single();
  // Já guardada: devolve a que existe.
  if (error?.code === "23505") {
    ({ data, error } = await supabase
      .from("saved_searches")
      .select("id, service, niche, locality, created_at")
      .eq("service", service)
      .eq("niche", niche)
      .eq("locality", locality)
      .single());
  }
  if (error || !data) {
    await reportError("radar guardar pesquisa", error?.code ?? "sem linha", user.id);
    return { ok: false };
  }
  revalidatePath("/painel/radar");
  return { ok: true, search: data as SavedSearch };
}

export async function deleteSavedSearch(id: string): Promise<{ ok: boolean }> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false };
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase.from("saved_searches").delete().eq("id", id).select("id");
  if (error) await reportError("radar apagar pesquisa", error.code, user.id);
  revalidatePath("/painel/radar");
  return { ok: !error && Boolean(data?.length) };
}
