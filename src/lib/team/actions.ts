"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { reportError } from "@/lib/events/log";
import { createClient } from "@/lib/supabase/server";
import { getAccess } from "./access";
import { isTeamRole, parseInviteEmail } from "./rules";

// Equipa: convites e funções. Os convites ficam pendentes (não se enviam emails enquanto
// os registos e o envio estiverem desligados) e não dão acesso a nada.

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  // Só o dono gere a equipa.
  if ((await getAccess()).role !== "owner") redirect("/painel/contactos");
  return { supabase, user };
}

export async function inviteMember(emailValue: unknown, roleValue: unknown): Promise<{ ok: true } | { ok: false; error: "email" | "self" | "exists" | "generic" }> {
  const email = parseInviteEmail(emailValue);
  if (!email || !isTeamRole(roleValue)) return { ok: false, error: "email" };
  const { supabase, user } = await currentUser();
  if (user.email && email === user.email.toLowerCase()) return { ok: false, error: "self" };
  const { error } = await supabase.from("team_members").insert({ email, role: roleValue });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "exists" };
    await reportError("equipa convidar", error.code, user.id);
    return { ok: false, error: "generic" };
  }
  revalidatePath("/painel/equipa");
  return { ok: true };
}

export async function setMemberRole(id: string, roleValue: unknown): Promise<{ ok: boolean }> {
  if (!/^[0-9a-f-]{36}$/i.test(id) || !isTeamRole(roleValue)) return { ok: false };
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase.from("team_members").update({ role: roleValue }).eq("id", id).select("id");
  if (error) await reportError("equipa função", error.code, user.id);
  revalidatePath("/painel/equipa");
  return { ok: !error && Boolean(data?.length) };
}

export async function removeMember(id: string): Promise<{ ok: boolean }> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false };
  const { supabase, user } = await currentUser();
  const { data, error } = await supabase.from("team_members").delete().eq("id", id).select("id");
  if (error) await reportError("equipa remover", error.code, user.id);
  revalidatePath("/painel/equipa");
  return { ok: !error && Boolean(data?.length) };
}
