"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { reportError } from "@/lib/events/log";
import { createClient } from "@/lib/supabase/server";
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
  const { data, error } = await supabase.from("client_projects").delete().eq("id", id).select("id");
  if (error) await reportError("projetos apagar", error.code, user.id);
  revalidatePath(PROJECTS_PATH);
  return { ok: !error && Boolean(data?.length) };
}
