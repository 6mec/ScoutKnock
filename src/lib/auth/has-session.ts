import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { hasAuthCookie } from "./session-cookie";

// Sem cookie não há chamada ao Supabase, para os visitantes anónimos não esperarem.
// Com cookie, valida a sessão, em vez de confiar nele.
export const hasSession = cache(async () => {
  await connection();

  const cookieStore = await cookies();
  if (!hasAuthCookie(cookieStore.getAll())) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user !== null;
});
