"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { reportError } from "@/lib/events/log";
import { createClient } from "@/lib/supabase/server";
import { parsePortfolio, type PortfolioError } from "./rules";

const UNIQUE_VIOLATION = "23505";

// Um portfólio por pessoa: guardar cria ou atualiza o mesmo.
export async function savePortfolio(
  value: unknown,
): Promise<{ ok: true } | { ok: false; error: PortfolioError | "taken" | "generic" }> {
  const parsed = parsePortfolio(value);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const p = parsed.portfolio;
  const { error } = await supabase.from("portfolios").upsert(
    {
      user_id: user.id,
      slug: p.slug,
      published: p.published,
      display_name: p.displayName,
      headline: p.headline,
      about: p.about,
      city: p.city,
      whatsapp: p.whatsapp,
      email: p.email,
      services: p.services,
      projects: p.projects,
      show_sites: p.showSites,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { ok: false, error: "taken" };
    await reportError("portfolio guardar", error.code, user.id);
    return { ok: false, error: "generic" };
  }

  revalidatePath("/painel/portfolio");
  revalidatePath(`/p/${p.slug}`);
  revalidatePath("/painel/contactos");
  return { ok: true };
}
