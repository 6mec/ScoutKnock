import type { OsmElement } from "./osm";

// Os elementos do OpenStreetMap chegam ao servidor vindos do browser, por isso nada aqui
// se aceita sem validar: forma, tamanhos e só as etiquetas que a app usa.

export const MAX_ELEMENTS = 300;
export const MAX_BODY_BYTES = 256 * 1024;
export const MAX_TAGS = 80;
export const MAX_TAG_KEY = 64;
// O próprio OSM não aceita valores maiores.
export const MAX_TAG_VALUE = 255;

const TYPES = new Set(["node", "way", "relation"]);
const KEPT_TAGS = new Set([
  "name",
  "addr:street",
  "addr:housenumber",
  "addr:postcode",
  "addr:city",
  "addr:place",
  "website",
  "url",
  "contact:website",
  "contact:instagram",
  "contact:facebook",
  "contact:phone",
  "contact:mobile",
  "facebook",
  "instagram",
  "phone",
  "mobile",
  "opening_hours",
  "disused:shop",
  "disused:amenity",
  "shop",
  "amenity",
  "craft",
  "office",
  "healthcare",
  "leisure",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function point(lat: unknown, lon: unknown) {
  return typeof lat === "number" &&
    typeof lon === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180
    ? { lat, lon }
    : null;
}

// Devolve só o que a app usa, ou null se o elemento não servir.
export function cleanOsmElement(value: unknown): OsmElement | null {
  if (!isRecord(value)) return null;
  const { type, id, lat, lon, center, tags } = value;
  if (typeof type !== "string" || !TYPES.has(type)) return null;
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0 || id >= 1e15) return null;
  if (!isRecord(tags)) return null;

  const entries = Object.entries(tags);
  if (entries.length > MAX_TAGS) return null;
  const kept: Record<string, string> = {};
  for (const [key, tagValue] of entries) {
    if (key.length > MAX_TAG_KEY || !KEPT_TAGS.has(key)) continue;
    if (typeof tagValue !== "string" || tagValue.length > MAX_TAG_VALUE) continue;
    kept[key] = tagValue;
  }
  // Sem nome não serve de oportunidade (elementToCompany também o deixa de fora).
  if (!kept.name?.trim()) return null;

  const element: OsmElement = { type: type as OsmElement["type"], id, tags: kept };
  const own = point(lat, lon);
  if (own) {
    element.lat = own.lat;
    element.lon = own.lon;
  }
  const middle = isRecord(center) ? point(center.lat, center.lon) : null;
  if (middle) element.center = middle;
  return element;
}

// Os que não servem ficam de fora; um pedido que não é uma lista, ou é grande demais,
// é recusado inteiro.
export function parseOsmElements(value: unknown): OsmElement[] | null {
  if (!Array.isArray(value) || value.length > MAX_ELEMENTS) return null;
  return cleanOsmElements(value);
}

export function cleanOsmElements(values: unknown[]): OsmElement[] {
  const elements: OsmElement[] = [];
  for (const value of values) {
    const element = cleanOsmElement(value);
    if (element) elements.push(element);
  }
  return elements;
}
