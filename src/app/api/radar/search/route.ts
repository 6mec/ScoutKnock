import { logEvent, reportError } from "@/lib/events/log";
import { enabledMarkets } from "@/lib/markets";
import { resolveLocality } from "@/lib/radar/localities";
import { getCompanyProvider } from "@/lib/radar/provider";
import { runSearch } from "@/lib/radar/run-search";
import { parseSearchQuery } from "@/lib/radar/search-events";
import { getSiteChecker } from "@/lib/radar/site-checker";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response(null, { status: 401 });

  let calls = 0;
  const provider = getCompanyProvider({
    userId: user.id,
    onCall: () => {
      calls += 1;
    },
  });
  if (!provider) return new Response(null, { status: 503 });

  const parsed = parseSearchQuery(await request.json().catch(() => null));
  if (!parsed) return new Response(null, { status: 400 });

  // Antes de contar: uma localidade fora da lista não gasta busca.
  const locality = resolveLocality(parsed.locality, enabledMarkets());
  if (!locality) return new Response(null, { status: 422 });
  const query = { ...parsed, locality: locality.name };

  // Conta antes de procurar. Se não der para contar, não há busca.
  const { data: allowed, error: limitError } = await supabase.rpc("consume_search");
  if (limitError) {
    await reportError("radar limite", limitError.code, user.id);
    return new Response(null, { status: 503 });
  }
  if (!allowed) return new Response(null, { status: 429 });

  const events = runSearch(
    provider,
    query,
    request.signal,
    getSiteChecker({ userId: user.id, kind: "search" }),
  );
  const encoder = new TextEncoder();
  let count = 0;
  let logged = false;
  const sites = { pending: false, checked: 0, failed: 0, skipped: 0 };

  // Só contagens: os endereços e os resultados não ficam guardados.
  async function logSites(cancelled: boolean) {
    if (!sites.pending) return;
    sites.pending = false;
    const { checked, failed, skipped } = sites;
    await logEvent(
      { type: "site_checks", data: { checked, failed, skipped, cancelled } },
      user!.id,
    );
  }

  // Conta também a busca cancelada, porque o fornecedor pode já ter sido pago.
  async function logSearch(cancelled: boolean) {
    if (logged) return;
    logged = true;
    await logEvent(
      { type: "search", data: { ...query!, count, calls, cancelled } },
      user!.id,
    );
  }

  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await events.next();
      if (done) {
        await logSearch(true);
        await logSites(true);
        controller.close();
        return;
      }

      if (value.type === "company") count += 1;
      if (value.type === "done") await logSearch(false);
      if (value.type === "sites_start") {
        sites.pending = true;
        sites.skipped = value.skipped.length;
      }
      if (value.type === "site") {
        if (value.status === "checked") sites.checked += 1;
        else sites.failed += 1;
      }
      if (value.type === "sites_done") await logSites(false);
      if (value.type === "error") {
        logged = true;
        await reportError("radar busca", value.code, user.id);
      }
      controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
    },
    async cancel() {
      await events.return(undefined);
      await logSearch(true);
      await logSites(true);
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}
