"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { reportError } from "@/lib/events/log";
import { createClient } from "@/lib/supabase/server";
import { parseRequestInput } from "./rules";

const REQUESTS_PATH = "/painel/pedidos";

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  return { supabase, user };
}

// A base de dados confirma que a ficha e a demo, se vierem, são de quem pede.
export async function createWorkRequest(value: unknown): Promise<{ ok: boolean; invalid?: boolean }> {
  const input = parseRequestInput(value);
  if (!input) return { ok: false, invalid: true };

  const { supabase, user } = await currentUser();
  const { error } = await supabase.from("work_requests").insert({
    kind: input.kind,
    brief: input.brief,
    company_name: input.companyName,
    contact_id: input.contactId,
    demo_id: input.demoId,
  });

  if (error) {
    await reportError("pedidos criar", error.code, user.id);
    return { ok: false };
  }

  revalidatePath(REQUESTS_PATH);
  return { ok: true };
}

export async function cancelWorkRequest(id: string): Promise<{ ok: boolean }> {
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase
    .from("work_requests")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select("id");
  if (error) await reportError("pedidos cancelar", error.code, user.id);
  revalidatePath(REQUESTS_PATH);
  return { ok: !error && Boolean(data?.length) };
}

export async function deleteWorkRequest(id: string): Promise<{ ok: boolean }> {
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase.from("work_requests").delete().eq("id", id).select("id");
  if (error) await reportError("pedidos apagar", error.code, user.id);
  revalidatePath(REQUESTS_PATH);
  return { ok: !error && Boolean(data?.length) };
}
