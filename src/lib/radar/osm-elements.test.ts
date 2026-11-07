import { describe, expect, it } from "vitest";
import { cleanOsmElement, MAX_ELEMENTS, MAX_TAGS, parseOsmElements } from "./osm-elements";

const base = { type: "node", id: 42, lat: 41.15, lon: -8.61, tags: { name: "Barbearia Apolo" } };

describe("elementos do OpenStreetMap vindos do browser", () => {
  it("aceita um elemento normal e guarda só as etiquetas que a app usa", () => {
    const element = cleanOsmElement({
      ...base,
      extra: "x",
      tags: { name: "Barbearia Apolo", phone: "+351 912 345 678", "addr:city": "Porto", note: "não interessa", source: "survey" },
    });
    expect(element).toEqual({
      type: "node",
      id: 42,
      lat: 41.15,
      lon: -8.61,
      tags: { name: "Barbearia Apolo", phone: "+351 912 345 678", "addr:city": "Porto" },
    });
  });

  it("recusa tipos, ids e etiquetas que não são do OSM", () => {
    expect(cleanOsmElement({ ...base, type: "area" })).toBeNull();
    expect(cleanOsmElement({ ...base, id: "42" })).toBeNull();
    expect(cleanOsmElement({ ...base, id: -1 })).toBeNull();
    expect(cleanOsmElement({ ...base, id: 1.5 })).toBeNull();
    expect(cleanOsmElement({ ...base, id: 1e16 })).toBeNull();
    expect(cleanOsmElement({ ...base, tags: ["name"] })).toBeNull();
    expect(cleanOsmElement({ ...base, tags: undefined })).toBeNull();
    expect(cleanOsmElement("texto")).toBeNull();
    expect(cleanOsmElement(null)).toBeNull();
  });

  it("sem nome não serve; valores que não são texto ou são longos demais ficam de fora", () => {
    expect(cleanOsmElement({ ...base, tags: { name: "  " } })).toBeNull();
    expect(cleanOsmElement({ ...base, tags: { name: 7 } })).toBeNull();
    const element = cleanOsmElement({ ...base, tags: { name: "A", website: "x".repeat(256), phone: { n: 1 } } });
    expect(element?.tags).toEqual({ name: "A" });
  });

  it("com etiquetas a mais, o elemento inteiro fica de fora", () => {
    const tags: Record<string, string> = { name: "A" };
    for (let i = 0; i < MAX_TAGS; i += 1) tags[`k${i}`] = "v";
    expect(cleanOsmElement({ ...base, tags })).toBeNull();
  });

  it("coordenadas impossíveis ficam de fora, o resto do elemento fica", () => {
    const element = cleanOsmElement({ ...base, lat: 200, lon: "x", center: { lat: 41, lon: -8 } });
    expect(element).toEqual({ type: "node", id: 42, center: { lat: 41, lon: -8 }, tags: { name: "Barbearia Apolo" } });
  });

  it("um pedido que não é uma lista, ou é grande demais, é recusado inteiro", () => {
    expect(parseOsmElements({ elements: [] })).toBeNull();
    expect(parseOsmElements(Array.from({ length: MAX_ELEMENTS + 1 }, () => base))).toBeNull();
    expect(parseOsmElements([base, { type: "x" }])).toHaveLength(1);
    expect(parseOsmElements([])).toEqual([]);
  });
});
