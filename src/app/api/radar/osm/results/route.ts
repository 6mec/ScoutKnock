import { logEvent, reportError } from "@/lib/events/log";
import { enabledMarkets } from "@/lib/markets";
import { resolveLocality } from "@/lib/radar/localities";
import { MAX_OSM_RESULTS } from "@/lib/radar/osm";
import { MAX_BODY_BYTES, parseOsmElements } from "@/lib/radar/osm-elements";
import { osmCompanies } from "@/lib/radar/osm-provider";
import { getCompanyProvider } from "@/lib/radar/provider";
import { scoreCompanies } from "@/lib/radar/run-search";
import { parseSearchQuery } from "@/lib/radar/search-events";
import { getSiteChecker } from "@/lib/radar/site-checker";
import { createClient } from "@/lib/supabase/server";

// Segundo passo da busca no OpenStreetMap: recebe do browser os elementos que o Overpass
// devolveu. Nada se aceita sem validar: sessão, tamanho, forma de cada elemento e só as
// etiquetas que a app usa. As empresas e a nota são calculadas aqui, com o código de
// sempre; nada do que o browser calculou conta. Os resultados não ficam guardados.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response(null, { status: 401 });

  if (getCompanyProvider()?.source !== "osm") return new Response(null, { status: 503 });

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return new Response(null, { status: 413 });
  const text = await request.text().catch(() => null);
  if (text === null) return new Response(null, { status: 400 });
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return new Response(null, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }

  const parsed = parseSearchQuery(body);
  if (!parsed) return new Response(null, { status: 400 });
  const locality = resolveLocality(parsed.locality, enabledMarkets());
  if (!locality) return new Response(null, { status: 422 });
  const query = { ...parsed, locality: locality.name };

  const { elements: rawElements, cached } = body as { elements?: unknown; cached?: unknown };
  const elements = parseOsmElements(rawElements);
  if (!elements) return new Response(null, { status: 400 });

  const companies = osmCompanies(elements, query.niche, locality.name).slice(0, MAX_OSM_RESULTS);
  const events = scoreCompanies(companies, query, {
    signal: request.signal,
    sites: getSiteChecker({ userId: user.id, kind: "search" }),
  });
  const encoder = new TextEncoder();
  const sites = { pending: false, checked: 0, failed: 0, skipped: 0 };

  // Uma repetição a partir da memória do browser não é uma busca nova.
  if (cached !== true) {
    await logEvent(
      { type: "search", data: { ...query, count: companies.length, calls: 0, cancelled: false } },
      user.id,
    );
  }

  // Só contagens: os endereços e os resultados não ficam guardados.
  async function logSites(cancelled: boolean) {
    if (!sites.pending) return;
    sites.pending = false;
    const { checked, failed, skipped } = sites;
    await logEvent({ type: "site_checks", data: { checked, failed, skipped, cancelled } }, user!.id);
  }

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await events.next();
      if (done) {
        await logSites(true);
        controller.close();
        return;
      }
      if (value.type === "sites_start") {
        sites.pending = true;
        sites.skipped = value.skipped.length;
      }
      if (value.type === "site") {
        if (value.status === "checked") sites.checked += 1;
        else sites.failed += 1;
      }
      if (value.type === "sites_done") await logSites(false);
      if (value.type === "error") await reportError("radar busca", value.code, user.id);
      controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
    },
    async cancel() {
      await events.return(undefined);
      await logSites(true);
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" },
  });
}
