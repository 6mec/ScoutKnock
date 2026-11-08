import { describe, expect, it } from "vitest";
import { exploredZones } from "./zones";

describe("zonas exploradas", () => {
  it("junta por localidade, soma empresas e guarda os nichos, as mais recentes primeiro", () => {
    const zones = exploredZones([
      { data: { niche: "Barbearias", locality: "Viseu", count: 12, cancelled: false }, created_at: "2026-11-01T10:00:00Z" },
      { data: { niche: "Cafés", locality: "viseu ", count: 8, cancelled: false }, created_at: "2026-11-05T10:00:00Z" },
      { data: { niche: "Barbearias", locality: "Porto", count: 30, cancelled: false }, created_at: "2026-11-03T10:00:00Z" },
      { data: { niche: "Barbearias", locality: "Braga", count: 0, cancelled: true }, created_at: "2026-11-06T10:00:00Z" },
      { data: null, created_at: "2026-11-07T10:00:00Z" },
    ]);
    expect(zones).toEqual([
      { locality: "Viseu", searches: 2, companies: 20, niches: ["Barbearias", "Cafés"], last: "2026-11-05T10:00:00Z" },
      { locality: "Porto", searches: 1, companies: 30, niches: ["Barbearias"], last: "2026-11-03T10:00:00Z" },
    ]);
  });
});
