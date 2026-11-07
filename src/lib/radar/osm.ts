import type { Locality } from "./localities";
import { normalizeText, PORTUGAL_AREAS } from "./localities";
import type { Company } from "./types";

// OpenStreetMap pela API pública Overpass: dados abertos (ODbL), grátis, com a
// atribuição "© contribuidores do OpenStreetMap". Não tem avaliações: reviewCount
// fica a null e a nota não usa esse motivo.

// Códigos ISO dos distritos e das regiões autónomas, para encontrar o concelho certo
// (há nomes repetidos, como Lagoa ou Calheta).
export const AREA_CODES: Record<string, string> = {
  Aveiro: "PT-01",
  Beja: "PT-02",
  Braga: "PT-03",
  "Bragança": "PT-04",
  "Castelo Branco": "PT-05",
  Coimbra: "PT-06",
  "Évora": "PT-07",
  Faro: "PT-08",
  Guarda: "PT-09",
  Leiria: "PT-10",
  Lisboa: "PT-11",
  Portalegre: "PT-12",
  Porto: "PT-13",
  "Santarém": "PT-14",
  "Setúbal": "PT-15",
  "Viana do Castelo": "PT-16",
  "Vila Real": "PT-17",
  Viseu: "PT-18",
  "Açores": "PT-20",
  "Região Autónoma dos Açores": "PT-20",
  Madeira: "PT-30",
  "Região Autónoma da Madeira": "PT-30",
};

type Selector = string;

// Nicho → etiquetas do OSM. Primeiro pelo nicho escrito, depois pela palavra-chave.
const NICHE_TAGS: [RegExp, Selector[]][] = [
  [/barb/, ['["shop"="hairdresser"]["hairdresser"~"barber|male",i]', '["shop"="hairdresser"]["name"~"barb",i]']],
  [/cabele|salao|salon/, ['["shop"="hairdresser"]']],
  [/unha|nail/, ['["shop"="beauty"]["beauty"~"nails",i]', '["shop"="beauty"]["name"~"nail|unha",i]']],
  [/estetic|beleza|beauty/, ['["shop"="beauty"]']],
  [/spa\b|spas/, ['["leisure"="spa"]', '["amenity"="spa"]', '["shop"="beauty"]["name"~"spa",i]']],
  [/pizz/, ['["amenity"="restaurant"]["cuisine"~"pizza",i]']],
  [/restaura/, ['["amenity"="restaurant"]']],
  [/pastel|confeit|doce/, ['["shop"="pastry"]', '["shop"="confectionery"]']],
  [/padar|panific/, ['["shop"="bakery"]']],
  [/cafe|cafetar/, ['["amenity"="cafe"]']],
  [/dent/, ['["amenity"="dentist"]', '["healthcare"="dentist"]']],
  [/fisio/, ['["healthcare"="physiotherapist"]']],
  [/psicol/, ['["healthcare"="psychotherapist"]', '["healthcare"="psychologist"]']],
  [/veterin/, ['["amenity"="veterinary"]']],
  [/clinic|medic/, ['["amenity"="clinic"]', '["amenity"="doctors"]', '["healthcare"="clinic"]']],
  [/ginas|fitness|gym/, ['["leisure"="fitness_centre"]']],
  [/pilates/, ['["sport"="pilates"]', '["leisure"="fitness_centre"]["name"~"pilates",i]']],
  [/yoga/, ['["sport"="yoga"]', '["name"~"yoga",i]["leisure"]']],
  [/danca/, ['["leisure"="dance"]', '["amenity"="dancing_school"]']],
  [/marcia|karat|jiu|judo|boxe/, ['["sport"~"martial_arts|karate|judo|boxing",i]']],
  [/lavagem auto|car wash/, ['["amenity"="car_wash"]']],
  [/oficina|mecan|auto/, ['["shop"="car_repair"]', '["shop"="tyres"]']],
  [/canaliz/, ['["craft"="plumber"]']],
  [/eletric/, ['["craft"="electrician"]']],
  [/lavand/, ['["shop"="laundry"]', '["shop"="dry_cleaning"]']],
  [/florist/, ['["shop"="florist"]']],
  [/otica|oculos/, ['["shop"="optician"]']],
  [/roupa|moda|vestu/, ['["shop"="clothes"]']],
  [/animais|pet/, ['["shop"="pet"]', '["shop"="pet_grooming"]']],
  [/livrar/, ['["shop"="books"]']],
  [/imobil/, ['["office"="estate_agent"]']],
  [/contabil/, ['["office"="accountant"]']],
  [/advog/, ['["office"="lawyer"]']],
  [/explica/, ['["amenity"="prep_school"]']],
  [/fotograf/, ['["craft"="photographer"]', '["shop"="photo"]']],
];

export const MAX_OSM_RESULTS = 60;
// Segundos que cada consulta declara ao Overpass. Os servidores atendem primeiro as
// consultas pequenas, e assim cada pedido cabe no tempo do browser e do servidor.
export const OVERPASS_TIMEOUT_S = 25;
// Uma região inteira (Açores, Madeira) vai em partes de alguns concelhos de cada vez.
const MAX_PARTS = 5;
const CONCELHOS_PER_PART = 4;
// As categorias de negócio do OSM. A busca pelo nome começa sempre por uma delas, para o
// servidor não ter de ler todos os elementos da zona.
const BUSINESS_KEYS = ["shop", "amenity", "craft", "office", "healthcare", "leisure"];

const escape = (text: string) => text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

// Só elementos com nome: os sem nome eram deitados fora e gastavam lugares dos 60.
// Sem etiqueta conhecida, procura pelo nome, com a raiz da palavra (sem o plural).
export function nicheSelectors(niche: string): Selector[] {
  const wanted = normalizeText(niche);
  const found = NICHE_TAGS.find(([pattern]) => pattern.test(wanted));
  if (found) {
    return found[1].map((selector) => (selector.includes('["name"') ? selector : `${selector}["name"]`));
  }
  const stem = wanted.replace(/(oes|aes|s)$/, "").trim();
  return stem ? BUSINESS_KEYS.map((key) => `["${key}"]["name"~"${escape(stem)}",i]`) : [];
}

// Na lista, os concelhos com nome repetido levam a região entre parênteses ("Lagoa
// (Açores)"). No OSM o nome é só "Lagoa", e o código da região distingue-os.
export function osmAreaName(name: string) {
  return name.replace(/\s*\([^)]*\)$/, "");
}

const concelhoArea = (name: string) =>
  `rel["boundary"="administrative"]["admin_level"="7"]["name"="${escape(osmAreaName(name))}"](area.d);`;

// Quando o distrito tem um concelho com o mesmo nome (Porto, Braga…), a lista só tem o
// concelho. Ficam como região inteira só as que não têm (Açores, Madeira).
function isWholeArea(locality: Locality) {
  const area = PORTUGAL_AREAS.find(({ name }) => name === locality.group);
  return locality.name === locality.group && !area?.concelhos.includes(locality.name);
}

export function areaStatement(locality: Locality): string | null {
  const code = AREA_CODES[locality.group];
  if (!code) return null;
  if (isWholeArea(locality)) return `area["ISO3166-2"="${code}"]->.a;`;
  return `area["ISO3166-2"="${code}"]->.d;${concelhoArea(locality.name)}map_to_area->.a;`;
}

function wrap(area: string, selectors: Selector[]) {
  return `[out:json][timeout:${OVERPASS_TIMEOUT_S}];${area}(${selectors.map((s) => `nwr${s}(area.a);`).join("")});out center tags ${MAX_OSM_RESULTS};`;
}

export function buildOverpassQuery(niche: string, locality: Locality): string | null {
  const area = areaStatement(locality);
  const selectors = nicheSelectors(niche);
  if (!area || selectors.length === 0) return null;
  return wrap(area, selectors);
}

// As consultas da busca, por ordem. Um concelho é uma consulta só; uma região inteira
// divide-se em partes, para cada pedido ser pequeno e os resultados irem aparecendo.
export function buildOverpassQueries(niche: string, locality: Locality): string[] {
  const code = AREA_CODES[locality.group];
  const selectors = nicheSelectors(niche);
  if (!code || selectors.length === 0) return [];
  const concelhos = PORTUGAL_AREAS.find(({ name }) => name === locality.group)?.concelhos ?? [];
  if (!isWholeArea(locality) || concelhos.length === 0) return [wrap(areaStatement(locality)!, selectors)];

  const size = Math.max(CONCELHOS_PER_PART, Math.ceil(concelhos.length / MAX_PARTS));
  const parts: string[] = [];
  for (let start = 0; start < concelhos.length; start += size) {
    const group = concelhos.slice(start, start + size).map(concelhoArea).join("");
    parts.push(wrap(`area["ISO3166-2"="${code}"]->.d;(${group});map_to_area->.a;`, selectors));
  }
  return parts;
}

export type OsmElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export function osmId(element: Pick<OsmElement, "type" | "id">) {
  return `osm-${element.type}-${element.id}`;
}

export function parseOsmId(id: string): { type: OsmElement["type"]; id: number } | null {
  const match = /^osm-(node|way|relation)-(\d{1,15})$/.exec(id);
  return match ? { type: match[1] as OsmElement["type"], id: Number(match[2]) } : null;
}

function firstUrl(...values: (string | undefined)[]) {
  for (const value of values) {
    const url = value?.split(";")[0]?.trim();
    if (!url) continue;
    const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    try {
      // Só endereços web: nada de javascript:, ftp: ou outros esquemas.
      const parsed = new URL(withScheme);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.toString();
    } catch {
      // Endereço inválido: tenta o seguinte.
    }
  }
  return null;
}

// Sem nome, ou marcado como fechado, não serve de oportunidade.
export function elementToCompany(element: OsmElement, niche: string, localityName: string): Company | null {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();
  if (!name || tags["disused:shop"] || tags["disused:amenity"] || tags.opening_hours === "closed") return null;

  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(", ");
  const city = tags["addr:city"] ?? tags["addr:place"] ?? localityName;
  const address = [street, [tags["addr:postcode"], city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const point = element.center ?? (element.lat !== undefined && element.lon !== undefined ? { lat: element.lat, lon: element.lon } : null);
  // Sem site, uma página de rede social conta como "site" de terceiros, como no Google.
  const website = firstUrl(tags.website, tags["contact:website"], tags.url, tags["contact:instagram"], tags["contact:facebook"], tags.facebook, tags.instagram);
  const phone = (tags.phone ?? tags["contact:phone"] ?? tags["contact:mobile"] ?? tags.mobile)?.split(";")[0]?.trim() || null;

  return {
    id: osmId(element),
    name,
    niche,
    locality: localityName,
    address: address || localityName,
    phone,
    website,
    reviewCount: null,
    hasOpeningHours: Boolean(tags.opening_hours),
    site: { isSlow: null, isMobileFriendly: null, isOutdated: null },
    ...(point ? { location: [point.lat, point.lon] as [number, number] } : {}),
  };
}
