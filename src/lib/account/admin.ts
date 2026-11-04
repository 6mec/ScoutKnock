import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Pergunta à base de dados se a pessoa com sessão tem o papel de admin. Qualquer erro
// (por exemplo, a migração ainda não aplicada) conta como "não": nunca dá mais acesso.
export async function isCurrentUserAdmin(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("am_i_admin");

  return !error && data === true;
}
