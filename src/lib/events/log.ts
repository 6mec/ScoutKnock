import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { eventData, type EventInput } from "./rules";

// Falhar o registo nunca pode estragar a ação do utilizador: não lança erros.
export async function logEvent(event: EventInput, userId?: string) {
  try {
    const { error } = await createAdminClient()
      .from("events")
      .insert({
        type: event.type,
        user_id: userId ?? null,
        data: eventData(event),
      });

    if (error) console.error(`eventos: ${error.code}`);
  } catch {
    console.error("eventos: falha ao registar");
  }
}

// Só a área e o código, sem mensagens que possam trazer dados pessoais.
export async function reportError(
  area: string,
  code: string | number | undefined,
  userId?: string,
) {
  const safeCode = String(code ?? "sem código");

  console.error(`${area}: ${safeCode}`);
  await logEvent({ type: "error", data: { area, code: safeCode } }, userId);
}
