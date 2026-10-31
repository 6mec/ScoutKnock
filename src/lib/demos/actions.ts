"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ptPT } from "@/i18n/pt-PT";
import { logEvent, reportError } from "@/lib/events/log";
import { parseCompanyId } from "@/lib/contacts/rules";
import { createClient } from "@/lib/supabase/server";
import {
  colorForNiche,
  createDemoSlug,
  parseAuthorName,
  parseDemoContent,
  parseDemoDraft,
} from "./rules";

const { demos: copy } = ptPT;
const GALLERY_PATH = "/painel/demos";

export type CreateDemoResult =
  | { status: "created"; id: string }
  | { status: "needsName" }
  | { status: "error"; message: string };

export type SaveDemoResult = { ok: boolean };

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  return { supabase, user };
}

async function failure(
  step: string,
  error: { code?: string } | null,
  userId: string,
): Promise<CreateDemoResult> {
  await reportError(`demos ${step}`, error?.code, userId);
  return { status: "error", message: copy.errors.generic };
}

export async function findMyDemo(companyIdValue: unknown) {
  const companyId = parseCompanyId(companyIdValue);
  if (!companyId) return null;

  const { supabase } = await currentUser();
  const { data } = await supabase
    .from("demo_sites")
    .select("id")
    .eq("company_id", companyId)
    .maybeSingle();

  return (data?.id as string | undefined) ?? null;
}

// Grava o place_id e o que o freelancer escreveu: não há cópia nem chamada ao Google.
export async function createDemo(
  companyIdValue: unknown,
  draftValue: unknown,
  authorName?: string,
): Promise<CreateDemoResult> {
  const { supabase, user } = await currentUser();

  const companyId = parseCompanyId(companyIdValue);
  const draft = parseDemoDraft(draftValue);
  if (!companyId || !draft) return failure("dados", null, user.id);

  const findExisting = () =>
    supabase
      .from("demo_sites")
      .select("id")
      .eq("company_id", companyId)
      .maybeSingle();

  const { data: existing } = await findExisting();
  if (existing) return { status: "created", id: existing.id };

  let name = parseAuthorName(authorName);
  if (name) {
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name })
      .eq("id", user.id);
    if (error) return failure("perfil", error, user.id);
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    name = parseAuthorName(profile?.display_name);
    if (!name) return { status: "needsName" };
  }

  const { data, error } = await supabase
    .from("demo_sites")
    .insert({
      user_id: user.id,
      slug: createDemoSlug(),
      company_id: companyId,
      company_name: draft.companyName,
      niche: draft.niche,
      locality: draft.locality,
      address: draft.address,
      phone: draft.phone,
      accent_color: colorForNiche(draft.niche),
      headline: `${draft.niche} · ${draft.locality}`,
      intro: copy.defaultIntro,
      author_name: name,
    })
    .select("id")
    .single();

  if (error) {
    if (error.message === "demo_limit") {
      return { status: "error", message: copy.errors.limit };
    }
    // Dois cliques ao mesmo tempo: o outro pedido já a criou.
    if (error.code === "23505") {
      const { data: created } = await findExisting();
      if (created) return { status: "created", id: created.id };
    }
    return failure("criar", error, user.id);
  }

  await logEvent(
    { type: "demo_created", data: { demoId: data.id, niche: draft.niche } },
    user.id,
  );
  revalidatePath(GALLERY_PATH);
  return { status: "created", id: data.id };
}

export async function saveDemo(
  id: string,
  value: unknown,
): Promise<SaveDemoResult> {
  const content = parseDemoContent(value);
  if (!content) return { ok: false };

  const { supabase, user } = await currentUser();
  const { data, error } = await supabase
    .from("demo_sites")
    .update({
      company_name: content.companyName,
      niche: content.niche,
      locality: content.locality,
      address: content.address,
      phone: content.phone,
      template: content.template,
      accent_color: content.accentColor,
      headline: content.headline,
      intro: content.intro,
    })
    .eq("id", id)
    .select("id");

  if (error || !data?.length) {
    await reportError("demos guardar", error?.code ?? "sem linha", user.id);
    return { ok: false };
  }

  revalidatePath(GALLERY_PATH);
  return { ok: true };
}

export async function setDemoSent(
  id: string,
  sent: boolean,
): Promise<SaveDemoResult> {
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase
    .from("demo_sites")
    .update({ status: sent ? "sent" : "draft" })
    .eq("id", id)
    .select("id");

  if (error || !data?.length) {
    await reportError("demos estado", error?.code ?? "sem linha", user.id);
    return { ok: false };
  }

  revalidatePath(GALLERY_PATH);
  return { ok: true };
}
