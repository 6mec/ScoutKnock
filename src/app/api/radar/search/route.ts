import { logEvent, reportError } from "@/lib/events/log";
import { getCompanyProvider } from "@/lib/radar/provider";
import { runSearch } from "@/lib/radar/run-search";
import { parseSearchQuery } from "@/lib/radar/search-events";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response(null, { status: 401 });

  const provider = getCompanyProvider();
  if (!provider) return new Response(null, { status: 503 });

  const query = parseSearchQuery(await request.json().catch(() => null));
  if (!query) return new Response(null, { status: 400 });

  const events = runSearch(provider, query, request.signal);
  const encoder = new TextEncoder();
  let count = 0;
  let logged = false;

  // Conta também a busca cancelada, porque o fornecedor pode já ter sido pago.
  async function logSearch(cancelled: boolean) {
    if (logged) return;
    logged = true;
    await logEvent(
      { type: "search", data: { ...query!, count, cancelled } },
      user!.id,
    );
  }

  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await events.next();
      if (done) {
        await logSearch(true);
        controller.close();
        return;
      }

      if (value.type === "company") count += 1;
      if (value.type === "done") await logSearch(false);
      if (value.type === "error") {
        logged = true;
        await reportError("radar busca", value.code, user.id);
      }
      controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
    },
    async cancel() {
      await events.return(undefined);
      await logSearch(true);
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}
