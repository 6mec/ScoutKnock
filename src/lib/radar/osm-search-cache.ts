import { normalizeText } from "./localities";
import type { OsmElement } from "./osm";
import { cleanOsmElements } from "./osm-elements";

// A mesma busca (nicho + localidade) repetida dentro de 30 minutos usa o que o Overpass
// já devolveu, guardado só neste separador do browser (sessionStorage). Não vai à base de
// dados e não conta no limite. "Procurar de novo" ignora-a.
export const CACHE_MS = 30 * 60 * 1000;
const MAX_ENTRIES = 8;
const STORAGE_KEY = "scoutknock:osm-busca:v1";

export type CachedSearch = { key: string; at: number; elements: OsmElement[] };

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

function session(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function osmSearchKey(niche: string, locality: string) {
  return `${normalizeText(niche)}|${normalizeText(locality)}`;
}

function readAll(storage: Storage | null): CachedSearch[] {
  try {
    const value = JSON.parse(storage?.getItem(STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(value)) return [];
    return value.flatMap((entry) => {
      if (typeof entry !== "object" || entry === null) return [];
      const { key, at, elements } = entry as Record<string, unknown>;
      if (typeof key !== "string" || typeof at !== "number" || !Array.isArray(elements)) return [];
      return [{ key, at, elements: cleanOsmElements(elements) }];
    });
  } catch {
    return [];
  }
}

export function readCachedSearch(key: string, now = Date.now(), storage = session()): CachedSearch | null {
  const hit = readAll(storage).find((entry) => entry.key === key);
  return hit && now - hit.at >= 0 && now - hit.at < CACHE_MS ? hit : null;
}

export function writeCachedSearch(key: string, elements: OsmElement[], now = Date.now(), storage = session()) {
  const fresh = readAll(storage).filter((entry) => entry.key !== key && now - entry.at < CACHE_MS);
  const entries = [{ key, at: now, elements }, ...fresh].slice(0, MAX_ENTRIES);
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Sem espaço ou sem armazenamento: a próxima busca vai ao Overpass, como sempre.
  }
}
