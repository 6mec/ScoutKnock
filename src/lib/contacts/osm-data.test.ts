import { describe, expect, it } from "vitest";
import { isOsmCompanyId, osmColumns, parseOsmDetails } from "./osm-data";

describe("dados do OpenStreetMap na ficha", () => {
  it("reconhece só os ids do OpenStreetMap", () => {
    expect(isOsmCompanyId("osm-node-123")).toBe(true);
    expect(isOsmCompanyId("manual-1")).toBe(false);
    expect(isOsmCompanyId("ChIJabc")).toBe(false);
  });

  it("guarda só a morada, o telefone e o dia", () => {
    expect(
      osmColumns({ address: "  Rua das Flores,   12, Porto ", phone: "+351 912 345 678" }, "2026-11-04"),
    ).toEqual({ manual_address: "Rua das Flores, 12, Porto", manual_phone: "+351 912 345 678", osm_data_on: "2026-11-04" });
    expect(osmColumns({ address: "", phone: null }, "2026-11-04")).toEqual({
      manual_address: null,
      manual_phone: null,
      osm_data_on: "2026-11-04",
    });
  });

  it("corta ao limite em vez de falhar ao guardar", () => {
    const columns = osmColumns({ address: "x".repeat(250), phone: "9".repeat(60) }, "2026-11-04");
    expect(columns.manual_address).toHaveLength(200);
    expect(columns.manual_phone).toHaveLength(40);
  });

  it("valida o que o Daniel corrige", () => {
    expect(parseOsmDetails({ address: " Rua A ", phone: "" })).toEqual({ address: "Rua A", phone: null });
    expect(parseOsmDetails({ address: "x".repeat(201) })).toBeNull();
    expect(parseOsmDetails({ phone: 912 })).toBeNull();
    expect(parseOsmDetails(null)).toBeNull();
  });
});
