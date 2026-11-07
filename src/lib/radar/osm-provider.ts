import { parseSiteUrl } from "@/lib/site";
import { enabledMarkets } from "@/lib/markets";
import { resolveLocality } from "./localities";
import { buildOverpassQueries, elementToCompany, parseOsmId, type OsmElement } from "./osm";
import { OverpassError, runOverpassQuery, searchOverpass } from "./overpass-client";
import type { CompanyProvider } from "./provider";
import type { Company } from "./types";

// No servidor, a ficha de uma empresa é um pedido pequeno, mas tem de caber no tempo de
// uma função da Netlify: cada servidor tem pouco tempo e há uma volta só.
const LOOKUP_TIMEOUT_MS = 7_000;

// Dados abertos (ODbL): podem ficar em memória. Assim, depois de uma busca, a mensagem e
// a ficha não voltam a esperar pelo Overpass. Uma hora, e no máximo 2000 empresas.
const CACHE_MS = 60 * 60 * 1000;
const CACHE_MAX = 2000;
// No globalThis: cada rota do Next pode carregar a sua cópia deste módulo, e a busca e
// a mensagem têm de ver a mesma memória.
const store = globalThis as typeof globalThis & {
  __scoutknockOsmCache?: Map<string, { company: Company; at: number }>;
};
const cache = (store.__scoutknockOsmCache ??= new Map());

export function rememberOsmCompany(company: Company, now = Date.now()) {
  cache.delete(company.id);
  cache.set(company.id, { company, at: now });
  while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value as string);
}

export function cachedOsmCompany(id: string, now = Date.now()) {
  const hit = cache.get(id);
  if (!hit) return null;
  if (now - hit.at > CACHE_MS) {
    cache.delete(id);
    return null;
  }
  return hit.company;
}

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

// A regra de uso do Overpass pede uma identificação da app, sem dados de quem procura.
// (No browser não se pode mudar: lá, o Overpass vê a origem do pedido.)
function userAgent(siteUrl?: string) {
  return `ScoutKnock/1.0${siteUrl ? ` (+${siteUrl}/bot)` : ""}`;
}

// Converte os elementos numa lista de empresas sem repetidas, e guarda-as na memória.
export function osmCompanies(elements: OsmElement[], niche: string, localityName: string) {
  const seen = new Set<string>();
  const companies: Company[] = [];
  for (const element of elements) {
    const company = elementToCompany(element, niche, localityName);
    if (!company || seen.has(company.id)) continue;
    seen.add(company.id);
    rememberOsmCompany(company);
    companies.push(company);
  }
  return companies;
}

export function createOsmProvider({
  fetchImpl = fetch,
  siteUrl = parseSiteUrl(process.env.SITE_URL) ?? undefined,
}: { fetchImpl?: FetchLike; siteUrl?: string } = {}): CompanyProvider {
  const headers = { "User-Agent": userAgent(siteUrl) };

  // A busca do Radar corre no browser (src/lib/radar/overpass-client.ts). Esta fica para
  // o desenvolvimento e para os testes, com as mesmas consultas.
  async function search({ niche, locality }: { niche: string; locality: string }, signal?: AbortSignal) {
    const place = resolveLocality(locality, enabledMarkets());
    if (!place) return [];
    const parts = buildOverpassQueries(niche, place);
    if (parts.length === 0) return [];
    const { elements, failure } = await searchOverpass(parts, { fetchImpl, headers, signal, rounds: 1 });
    if (failure && elements.length === 0) throw new OverpassError(failure);
    return osmCompanies(elements, niche, place.name);
  }

  return {
    usesSampleData: false,
    source: "osm",
    search: (query) => search(query),
    async *stream(query, signal) {
      for (const company of await search(query, signal)) {
        if (signal?.aborted) return;
        yield company;
      }
    },
    async findById(id) {
      const parsed = parseOsmId(id);
      if (!parsed) return null;
      const cached = cachedOsmCompany(id);
      if (cached) return cached;
      const elements = await runOverpassQuery(`[out:json][timeout:5];${parsed.type}(${parsed.id});out center tags;`, {
        fetchImpl,
        headers,
        rounds: 1,
        requestTimeoutMs: LOOKUP_TIMEOUT_MS,
      });
      const element = elements[0];
      if (!element) return null;
      // O nicho não fica guardado no OSM: usa a categoria do próprio elemento.
      const tags = element.tags ?? {};
      const kind = tags.shop ?? tags.amenity ?? tags.craft ?? tags.office ?? tags.healthcare ?? tags.leisure ?? "";
      const locality = tags["addr:city"] ?? tags["addr:place"] ?? "";
      const company = elementToCompany(element, kind ? kind.replace(/_/g, " ") : "Negócio local", locality);
      if (company) rememberOsmCompany(company);
      return company;
    },
  };
}
