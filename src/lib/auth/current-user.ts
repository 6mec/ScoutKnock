import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Valida a sessão junto do Supabase em vez de confiar só no cookie.
export async function requireUser() {
  // O cliente do Supabase usa Date.now(): só pode correr no pedido, não no pré-render.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  return { id: user.id, email: user.email ?? "" };
}
