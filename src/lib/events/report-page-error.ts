"use server";

import { createClient } from "@/lib/supabase/server";
import { reportError } from "./log";

const DIGEST_PATTERN = /^[0-9A-Za-z-]{1,40}$/;

// Só com sessão: uma ação pública não pode deixar anónimos encher a tabela.
export async function reportPageError(digest: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const code =
    typeof digest === "string" && DIGEST_PATTERN.test(digest) ? digest : "cliente";

  await reportError("página", code, user.id);
}
