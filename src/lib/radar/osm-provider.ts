import { parseSiteUrl } from "@/lib/site";
import { enabledMarkets } from "@/lib/markets";
import { resolveLocality } from "./localities";
import { buildOverpassQuery, elementToCompany, parseOsmId, type OsmElement } from "./osm";
import type { CompanyProvider } from "./provider";
import type { Company } from "./types";

// Servidores públicos do Overpass. Estão muitas vezes cheios: tenta o seguinte.
export const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const TIMEOUT_MS = 90_000;

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

export class OsmApiError extends Error {
  constructor(readonly status: number) {
    super(`osm: ${status}`);
  }
}

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

// A regra de uso do Overpass pede uma identificação da app, sem dados de quem procura.
function userAgent(siteUrl?: string) {
  return `ScoutKnock/1.0${siteUrl ? ` (+${siteUrl}/bot)` : ""}`;
}

async function overpass(query: string, { fetchImpl, siteUrl, signal }: { fetchImpl: FetchLike; siteUrl?: string; signal?: AbortSignal }) {
  let lastError: unknown = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    try {
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": userAgent(siteUrl),
        },
        body: new URLSearchParams({ data: query }).toString(),
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
      // Cheio ou com limite: o seguinte pode responder.
      if (response.status === 429 || response.status >= 500) {
        lastError = new OsmApiError(response.status);
        continue;
      }
      if (!response.ok) throw new OsmApiError(response.status);
      const body = (await response.json()) as { elements?: OsmElement[] };
      return body.elements ?? [];
    } catch (error) {
      if (signal?.aborted) throw error;
      lastError = error;
    }
  }
  throw lastError ?? new OsmApiError(0);
}

export function createOsmProvider({
  fetchImpl = fetch,
  siteUrl = parseSiteUrl(process.env.SITE_URL) ?? undefined,
}: { fetchImpl?: FetchLike; siteUrl?: string } = {}): CompanyProvider {
  async function search({ niche, locality }: { niche: string; locality: string }, signal?: AbortSignal) {
    const place = resolveLocality(locality, enabledMarkets());
    if (!place) return [];
    const query = buildOverpassQuery(niche, place);
    if (!query) return [];
    const elements = await overpass(query, { fetchImpl, siteUrl, signal });
    const seen = new Set<string>();
    const companies: Company[] = [];
    for (const element of elements) {
      const company = elementToCompany(element, niche, place.name);
      if (!company || seen.has(company.id)) continue;
      seen.add(company.id);
      rememberOsmCompany(company);
      companies.push(company);
    }
    return companies;
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
      const elements = await overpass(`[out:json][timeout:25];${parsed.type}(${parsed.id});out center tags;`, {
        fetchImpl,
        siteUrl,
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
