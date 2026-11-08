"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { reportError } from "@/lib/events/log";
import { createClient } from "@/lib/supabase/server";
import { todayIn } from "@/lib/demos/booking";
import { PORTFOLIO_BUCKET } from "@/lib/portfolio/images";
import { parsePaymentInput, type PaymentError } from "./payments";
import { parseRequestInput, requestKindOf } from "@/lib/requests/rules";
import { parseProjectFields, parseProjectInput, toRow, type ProjectError } from "./rules";

const PROJECTS_PATH = "/painel/projetos";

type Result = { ok: true; id?: string } | { ok: false; error: ProjectError | "generic" };

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  return { supabase, user };
}

// A base de dados confirma que a ficha e o pedido, se vierem, são de quem cria.
export async function createProject(value: unknown): Promise<Result> {
  const parsed = parseProjectInput(value);
  if (!parsed.ok) return parsed;

  const { supabase, user } = await currentUser();
  const { data, error } = await supabase
    .from("client_projects")
    .insert({
      ...toRow(parsed.input),
      contact_id: parsed.input.contactId,
      work_request_id: parsed.input.workRequestId,
    })
    .select("id")
    .single();

  if (error) {
    await reportError("projetos criar", error.code, user.id);
    return { ok: false, error: "generic" };
  }
  revalidatePath(PROJECTS_PATH);
  return { ok: true, id: data.id as string };
}

// Criar o projeto e o pedido de trabalho juntos (botão "Criar projeto" com "Pedir também
// ao /pedidos"). Primeiro o pedido, porque o projeto guarda de onde veio; se o projeto
// falhar, o pedido é apagado para não ficar solto.
export async function createProjectWithRequest(
  value: unknown,
  brief: unknown,
): Promise<Result | { ok: false; error: "brief" | "requestKind" }> {
  const parsed = parseProjectInput(value);
  if (!parsed.ok) return parsed;
  const kind = requestKindOf(parsed.input.kind);
  if (!kind) return { ok: false, error: "requestKind" };
  const request = parseRequestInput({
    kind,
    brief,
    companyName: parsed.input.companyName,
    contactId: parsed.input.contactId,
    demoId: null,
  });
  if (!request) return { ok: false, error: "brief" };

  const { supabase, user } = await currentUser();
  const { data: created, error: requestError } = await supabase
    .from("work_requests")
    .insert({
      kind: request.kind,
      brief: request.brief,
      company_name: request.companyName,
      contact_id: request.contactId,
      demo_id: null,
    })
    .select("id")
    .single();
  if (requestError) {
    await reportError("projetos criar pedido", requestError.code, user.id);
    return { ok: false, error: "generic" };
  }

  const { data, error } = await supabase
    .from("client_projects")
    .insert({
      ...toRow(parsed.input),
      contact_id: parsed.input.contactId,
      work_request_id: created.id,
    })
    .select("id")
    .single();
  if (error) {
    await reportError("projetos criar com pedido", error.code, user.id);
    await supabase.from("work_requests").delete().eq("id", created.id);
    return { ok: false, error: "generic" };
  }
  revalidatePath(PROJECTS_PATH);
  return { ok: true, id: data.id as string };
}

export async function updateProject(id: string, value: unknown): Promise<Result> {
  const parsed = parseProjectFields(value);
  if (!parsed.ok) return parsed;

  const { supabase, user } = await currentUser();
  const { data, error } = await supabase
    .from("client_projects")
    .update(toRow(parsed.fields))
    .eq("id", id)
    .select("id");

  if (error || !data?.length) {
    if (error) await reportError("projetos guardar", error.code, user.id);
    return { ok: false, error: "generic" };
  }
  revalidatePath(PROJECTS_PATH);
  return { ok: true, id };
}

export async function deleteProject(id: string): Promise<{ ok: boolean }> {
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase.from("client_projects").delete().eq("id", id).select("id, portfolio_image");
  if (error) await reportError("projetos apagar", error.code, user.id);
  // A captura do portfólio sai com o projeto.
  const image = (data?.[0] as { portfolio_image: string | null } | undefined)?.portfolio_image;
  if (image) await supabase.storage.from(PORTFOLIO_BUCKET).remove([image]);
  revalidatePath(PROJECTS_PATH);
  return { ok: !error && Boolean(data?.length) };
}

// Pagamentos recebidos: registo manual. A base de dados confirma que o projeto é de quem regista.
export async function addPayment(value: unknown): Promise<{ ok: true } | { ok: false; error: PaymentError | "generic" }> {
  const parsed = parsePaymentInput(value, todayIn());
  if (!parsed.ok) return parsed;

  const { supabase, user } = await currentUser();
  const { error } = await supabase.from("client_project_payments").insert({
    project_id: parsed.input.projectId,
    kind: parsed.input.kind,
    amount: parsed.input.amount,
    paid_on: parsed.input.paidOn,
    note: parsed.input.note,
  });
  if (error) {
    await reportError("projetos pagamento", error.code, user.id);
    return { ok: false, error: "generic" };
  }
  revalidatePath(PROJECTS_PATH);
  return { ok: true };
}

export async function deletePayment(id: string): Promise<{ ok: boolean }> {
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase.from("client_project_payments").delete().eq("id", id).select("id");
  if (error) await reportError("projetos apagar pagamento", error.code, user.id);
  revalidatePath(PROJECTS_PATH);
  return { ok: !error && Boolean(data?.length) };
}
