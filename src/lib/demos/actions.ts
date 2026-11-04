"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ptPT } from "@/i18n/pt-PT";
import { logEvent, reportError } from "@/lib/events/log";
import { parseCompanyId } from "@/lib/contacts/rules";
import { messageCostEur } from "@/lib/messages/rules";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { IDENTITIES, isIdentityKey, matchIdentity } from "./identities";
import { bookingByDefault } from "./booking";
import {
  createDemoSlug,
  MAX_COMPANY_NAME,
  MAX_LOCALITY,
  MAX_NICHE,
  parseAuthorName,
  parseDemoContent,
  parseDemoDraft,
} from "./rules";
import { getSiteWriter, sampleSiteCopy, type SiteCopy } from "./site-writer";

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
  // Uma busca de marcações liga a secção de marcações em qualquer nicho.
  withBooking?: unknown,
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

  // Começa já com a identidade e os textos do modelo do nicho: grátis e sem IA.
  const nicheStyle = matchIdentity(draft.niche);
  const identity = IDENTITIES[nicheStyle];
  const start = sampleSiteCopy({ ...draft, nicheStyle });
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
      template: identity.layout,
      accent_color: identity.palette.accent,
      niche_style: nicheStyle,
      headline: start.headline,
      intro: start.intro,
      subheadline: start.subheadline,
      cta_label: start.ctaLabel,
      about: start.about,
      services: start.services,
      highlights: start.highlights,
      booking_enabled: withBooking === true || bookingByDefault(nicheStyle),
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
      niche_style: content.nicheStyle,
      subheadline: content.subheadline || null,
      cta_label: content.ctaLabel || null,
      about: content.about || null,
      services: content.services,
      highlights: content.highlights,
      booking_enabled: content.bookingEnabled,
      booking_hours: content.bookingHours || null,
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

export type GenerateCopyResult =
  | { ok: true; copy: SiteCopy; isSample: boolean; remaining: number | null }
  | { ok: false; error: "limit" | "generic" };

function field(value: unknown, max: number) {
  return typeof value === "string" && value.trim() && value.trim().length <= max
    ? value.trim()
    : null;
}

// Escreve os textos do site. Sem a chave da Anthropic, devolve o modelo do nicho (grátis);
// com a chave, gasta uma das 3 escritas desta demo antes de chamar o Claude.
// Não guarda nada: o editor mostra os textos e o freelancer decide.
export async function generateDemoCopy(
  id: string,
  value: unknown,
): Promise<GenerateCopyResult> {
  const raw = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
  const companyName = field(raw.companyName, MAX_COMPANY_NAME);
  const niche = field(raw.niche, MAX_NICHE);
  const locality = field(raw.locality, MAX_LOCALITY);
  if (!companyName || !niche || !locality) return { ok: false, error: "generic" };
  const nicheStyle = isIdentityKey(raw.nicheStyle) ? raw.nicheStyle : matchIdentity(niche);

  const { supabase, user } = await currentUser();
  const { data: demo } = await supabase.from("demo_sites").select("id").eq("id", id).maybeSingle();
  if (!demo) return { ok: false, error: "generic" };

  const writer = getSiteWriter(process.env.ANTHROPIC_API_KEY, async (usage) => {
    const { error } = await createAdminClient().from("api_costs").insert({
      user_id: user.id,
      provider: "claude",
      kind: "demo_copy",
      units: usage.inputTokens + usage.outputTokens,
      cost_eur: messageCostEur(usage),
    });
    if (error) await reportError("demos textos custo", error.code, user.id);
  });

  let remaining: number | null = null;
  if (!writer.isSample) {
    const { data: left, error } = await supabase.rpc("use_demo_ai_generation", { target_demo: id });
    if (error) {
      await reportError("demos textos limite", error.code, user.id);
      return { ok: false, error: "generic" };
    }
    if ((left as number) < 0) return { ok: false, error: "limit" };
    remaining = left as number;
  }

  try {
    const copy = await writer.write({ companyName, niche, locality, nicheStyle });
    return { ok: true, copy, isSample: writer.isSample, remaining };
  } catch (error) {
    await reportError("demos textos", error instanceof Error ? error.message.slice(0, 40) : "erro", user.id);
    return { ok: false, error: "generic" };
  }
}
