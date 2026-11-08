"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { reportError } from "@/lib/events/log";
import { createClient } from "@/lib/supabase/server";
import { imagePath, MAX_IMAGE_BYTES, PORTFOLIO_BUCKET, sniffImage } from "./images";
import {
  checkSlug,
  MAX_WORKS,
  parsePortfolio,
  parseTestimonial,
  parseWork,
  type PortfolioError,
  type TestimonialError,
  type WorkError,
} from "./rules";

const UNIQUE_VIOLATION = "23505";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  return { supabase, user };
}

async function revalidatePublic(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.from("portfolios").select("slug").maybeSingle();
  revalidatePath("/painel/portfolio");
  if (data?.slug) revalidatePath(`/p/${data.slug}`);
}

// Um portfólio por pessoa: guardar cria ou atualiza o mesmo. A lista antiga escrita à mão
// e o interruptor dos sites das demos não se mexem (já não saem na página).
export async function savePortfolio(
  value: unknown,
): Promise<{ ok: true } | { ok: false; error: PortfolioError | "taken" | "generic" }> {
  const parsed = parsePortfolio(value);
  if (!parsed.ok) return parsed;

  const { supabase, user } = await currentUser();
  const p = parsed.portfolio;
  const { error } = await supabase.from("portfolios").upsert(
    {
      user_id: user.id,
      slug: p.slug,
      published: p.published,
      indexable: p.indexable,
      display_name: p.displayName,
      headline: p.headline,
      about: p.about,
      city: p.city,
      whatsapp: p.whatsapp,
      email: p.email,
      services: p.services,
      process_steps: p.processSteps,
      price_from: p.priceFrom,
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

// Endereço livre? Só diz sim ou não (a base de dados não revela de quem é).
export async function slugAvailable(value: string): Promise<{ available: boolean | null }> {
  const { slug, valid } = checkSlug(value, "");
  if (!valid) return { available: null };
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase.rpc("portfolio_slug_available", { candidate: slug });
  if (error) {
    await reportError("portfolio endereço", error.code, user.id);
    return { available: null };
  }
  return { available: data === true };
}

type TestimonialResult = { ok: true; id: string } | { ok: false; error: TestimonialError | "generic" };

export async function saveTestimonial(id: string | null, value: unknown): Promise<TestimonialResult> {
  const parsed = parseTestimonial(value);
  if (!parsed.ok) return parsed;
  const { supabase, user } = await currentUser();
  const t = parsed.testimonial;
  const row = { first_name: t.firstName, company: t.company, quote: t.quote, authorized: t.authorized, project_id: t.projectId };
  const query =
    id && UUID.test(id)
      ? supabase.from("portfolio_testimonials").update(row).eq("id", id).select("id").single()
      : supabase.from("portfolio_testimonials").insert(row).select("id").single();
  const { data, error } = await query;
  if (error || !data) {
    await reportError("portfolio opinião", error?.code ?? "sem linha", user.id);
    return { ok: false, error: "generic" };
  }
  await revalidatePublic(supabase);
  return { ok: true, id: data.id as string };
}

export async function deleteTestimonial(id: string): Promise<{ ok: boolean }> {
  if (!UUID.test(id)) return { ok: false };
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase.from("portfolio_testimonials").delete().eq("id", id).select("id");
  if (error) await reportError("portfolio apagar opinião", error.code, user.id);
  await revalidatePublic(supabase);
  return { ok: !error && Boolean(data?.length) };
}

type WorkResult = { ok: true } | { ok: false; error: WorkError | "max" | "generic" };

async function loadProject(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string) {
  if (!UUID.test(projectId)) return null;
  const { data } = await supabase
    .from("client_projects")
    .select("id, status, portfolio_show, portfolio_image")
    .eq("id", projectId)
    .maybeSingle();
  return data as { id: string; status: string; portfolio_show: boolean; portfolio_image: string | null } | null;
}

// "Pode mostrar", frase e ligação pública. Desmarcar apaga também a captura.
export async function saveProjectWork(projectId: string, value: unknown): Promise<WorkResult> {
  const { supabase, user } = await currentUser();
  const project = await loadProject(supabase, projectId);
  if (!project) return { ok: false, error: "generic" };
  const parsed = parseWork(value, project.status);
  if (!parsed.ok) return parsed;

  if (parsed.work.show && !project.portfolio_show) {
    const { count } = await supabase
      .from("client_projects")
      .select("id", { count: "exact", head: true })
      .eq("portfolio_show", true);
    if ((count ?? 0) >= MAX_WORKS) return { ok: false, error: "max" };
  }

  const removeImage = !parsed.work.show && project.portfolio_image;
  const { error } = await supabase
    .from("client_projects")
    .update({
      portfolio_show: parsed.work.show,
      ...(parsed.work.show ? { portfolio_draft: false } : {}),
      portfolio_summary: parsed.work.summary,
      portfolio_url: parsed.work.url,
      ...(removeImage ? { portfolio_image: null } : {}),
    })
    .eq("id", project.id);
  if (error) {
    await reportError("portfolio trabalho", error.code, user.id);
    return { ok: false, error: "generic" };
  }
  if (removeImage) await supabase.storage.from(PORTFOLIO_BUCKET).remove([project.portfolio_image as string]);

  revalidatePath("/painel/projetos");
  await revalidatePublic(supabase);
  return { ok: true };
}

type ImageResult = { ok: true; path: string } | { ok: false; error: "type" | "size" | "generic" };

// A captura já vem reduzida do browser; aqui confirma-se o tipo pelos bytes e o tamanho.
export async function uploadProjectImage(projectId: string, form: FormData): Promise<ImageResult> {
  const file = form.get("image");
  if (!(file instanceof File)) return { ok: false, error: "type" };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "size" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImage(bytes);
  if (!type) return { ok: false, error: "type" };

  const { supabase, user } = await currentUser();
  const project = await loadProject(supabase, projectId);
  if (!project) return { ok: false, error: "generic" };

  const path = imagePath(user.id, project.id, type);
  const upload = await supabase.storage.from(PORTFOLIO_BUCKET).upload(path, bytes, { contentType: type, cacheControl: "31536000" });
  if (upload.error) {
    await reportError("portfolio imagem", upload.error.name, user.id);
    return { ok: false, error: "generic" };
  }
  const { error } = await supabase.from("client_projects").update({ portfolio_image: path }).eq("id", project.id);
  if (error) {
    await supabase.storage.from(PORTFOLIO_BUCKET).remove([path]);
    await reportError("portfolio imagem guardar", error.code, user.id);
    return { ok: false, error: "generic" };
  }
  if (project.portfolio_image) await supabase.storage.from(PORTFOLIO_BUCKET).remove([project.portfolio_image]);

  revalidatePath("/painel/projetos");
  await revalidatePublic(supabase);
  return { ok: true, path };
}

export async function removeProjectImage(projectId: string): Promise<{ ok: boolean }> {
  const { supabase, user } = await currentUser();
  const project = await loadProject(supabase, projectId);
  if (!project?.portfolio_image) return { ok: Boolean(project) };
  const { error } = await supabase.from("client_projects").update({ portfolio_image: null }).eq("id", project.id);
  if (error) {
    await reportError("portfolio imagem apagar", error.code, user.id);
    return { ok: false };
  }
  await supabase.storage.from(PORTFOLIO_BUCKET).remove([project.portfolio_image]);
  revalidatePath("/painel/projetos");
  await revalidatePublic(supabase);
  return { ok: true };
}
