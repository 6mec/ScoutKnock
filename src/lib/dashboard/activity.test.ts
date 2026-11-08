import { describe, expect, it } from "vitest";
import { recentActivity, responseRate } from "./metrics";

describe("atividade recente", () => {
  it("junta contactos e projetos, os mais recentes primeiro, e salta os sem nome", () => {
    const items = recentActivity(
      [
        { contact_id: "c1", status: "replied", created_at: "2026-11-08T10:00:00Z" },
        { contact_id: "c9", status: "contacted", created_at: "2026-11-08T12:00:00Z" },
      ],
      [{ project_id: "p1", kind: "created", status: "in_progress", created_at: "2026-11-08T11:00:00Z" }],
      new Map([["c1", "Café"]]),
      new Map([["p1", "Barbearia"]]),
    );
    expect(items.map((item) => [item.kind, item.title, item.created])).toEqual([
      ["project", "Barbearia", true],
      ["contact", "Café", false],
    ]);
  });
});

describe("taxa de resposta", () => {
  it("respostas sobre contactadas; sem contactos, sem taxa", () => {
    expect(responseRate([{ stage: "contacted", count: 8 }, { stage: "replied", count: 2 }, { stage: "proposal", count: 1 }, { stage: "won", count: 0 }]).percent).toBe(25);
    expect(responseRate([{ stage: "contacted", count: 0 }, { stage: "replied", count: 0 }, { stage: "proposal", count: 0 }, { stage: "won", count: 0 }]).percent).toBeNull();
  });
});
