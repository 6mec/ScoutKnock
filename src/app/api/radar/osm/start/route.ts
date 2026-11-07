import { reportError } from "@/lib/events/log";
import { enabledMarkets } from "@/lib/markets";
import { resolveLocality } from "@/lib/radar/localities";
import { buildOverpassQueries } from "@/lib/radar/osm";
import { getCompanyProvider } from "@/lib/radar/provider";
import { parseSearchQuery } from "@/lib/radar/search-events";
import { createClient } from "@/lib/supabase/server";

// Primeiro passo da busca no OpenStreetMap: confirma a sessão, valida a busca, conta-a no
// limite e devolve as consultas, montadas aqui. O browser faz os pedidos ao Overpass
// (podem levar mais tempo do que uma função aguenta) e manda os dados a /results.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response(null, { status: 401 });

  if (getCompanyProvider()?.source !== "osm") return new Response(null, { status: 503 });

  const parsed = parseSearchQuery(await request.json().catch(() => null));
  if (!parsed) return new Response(null, { status: 400 });

  // Antes de contar: uma localidade fora da lista não gasta busca.
  const locality = resolveLocality(parsed.locality, enabledMarkets());
  if (!locality) return new Response(null, { status: 422 });

  // Um nicho sem nada para procurar também não gasta busca.
  const parts = buildOverpassQueries(parsed.niche, locality);
  if (parts.length === 0) return Response.json({ parts, counted: false }, { headers: { "Cache-Control": "no-store" } });

  // Conta antes de procurar. Se não der para contar, não há busca.
  const { data: allowed, error } = await supabase.rpc("consume_search");
  if (error) {
    await reportError("radar limite", error.code, user.id);
    return new Response(null, { status: 503 });
  }
  if (!allowed) return new Response(null, { status: 429 });

  return Response.json({ parts, counted: true }, { headers: { "Cache-Control": "no-store" } });
}
