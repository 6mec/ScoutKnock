import { describe, expect, it } from "vitest";
import { CACHE_MS, osmSearchKey, readCachedSearch, writeCachedSearch } from "./osm-search-cache";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    data,
  };
}

const element = { type: "node" as const, id: 1, tags: { name: "Café Central" } };

describe("memória das buscas no browser", () => {
  it("a mesma busca, escrita de outra maneira, é a mesma", () => {
    expect(osmSearchKey(" Cafés ", "Porto")).toBe(osmSearchKey("cafes", "porto"));
    expect(osmSearchKey("Cafés", "Porto")).not.toBe(osmSearchKey("Cafés", "Braga"));
  });

  it("devolve a busca durante 30 minutos e depois esquece", () => {
    const storage = memoryStorage();
    writeCachedSearch("k", [element], 1000, storage);
    expect(readCachedSearch("k", 1000 + CACHE_MS - 1, storage)?.elements).toEqual([element]);
    expect(readCachedSearch("k", 1000 + CACHE_MS, storage)).toBeNull();
    expect(readCachedSearch("outra", 1000, storage)).toBeNull();
  });

  it("guarda no máximo 8 buscas, as mais recentes", () => {
    const storage = memoryStorage();
    for (let i = 0; i < 10; i += 1) writeCachedSearch(`k${i}`, [element], 1000 + i, storage);
    expect(readCachedSearch("k9", 2000, storage)).not.toBeNull();
    expect(readCachedSearch("k2", 2000, storage)).not.toBeNull();
    expect(readCachedSearch("k1", 2000, storage)).toBeNull();
  });

  it("dados estragados ou mexidos não rebentam e só passam elementos válidos", () => {
    const storage = memoryStorage();
    storage.setItem("scoutknock:osm-busca:v1", "{não é json");
    expect(readCachedSearch("k", 0, storage)).toBeNull();
    storage.setItem(
      "scoutknock:osm-busca:v1",
      JSON.stringify([{ key: "k", at: 0, elements: [element, { type: "x", id: 2, tags: {} }] }]),
    );
    expect(readCachedSearch("k", 0, storage)?.elements).toEqual([element]);
  });

  it("sem armazenamento, não guarda nem falha", () => {
    expect(() => writeCachedSearch("k", [element], 0, null)).not.toThrow();
    expect(readCachedSearch("k", 0, null)).toBeNull();
  });
});
