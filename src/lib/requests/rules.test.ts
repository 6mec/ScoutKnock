import { describe, expect, it } from "vitest";
import { parseRequestInput, safeResultUrl, sortRequests, type WorkRequest } from "./rules";

const id = "3f2a6c1e-8b4d-4c2a-9e1f-0a1b2c3d4e5f";

describe("pedidos de trabalho", () => {
  it("aceita um pedido completo e limpa os espaços", () => {
    expect(parseRequestInput({ kind: "app", brief: "  Agenda  ", companyName: " Barbearia ", contactId: id, demoId: "" })).toEqual({
      kind: "app",
      brief: "Agenda",
      companyName: "Barbearia",
      contactId: id,
      demoId: null,
    });
  });

  it("recusa tipos desconhecidos, textos vazios ou longos e ids estranhos", () => {
    expect(parseRequestInput({ kind: "logo", brief: "x", companyName: "y" })).toBeNull();
    expect(parseRequestInput({ kind: "site", brief: " ", companyName: "y" })).toBeNull();
    expect(parseRequestInput({ kind: "site", brief: "x".repeat(4001), companyName: "y" })).toBeNull();
    expect(parseRequestInput({ kind: "site", brief: "x", companyName: "y", demoId: "1; drop" })).toBeNull();
    expect(parseRequestInput(null)).toBeNull();
  });

  it("ordena: em curso, por fazer, feitos e cancelados", () => {
    const make = (status: WorkRequest["status"], created_at: string) =>
      ({ id: status + created_at, status, created_at }) as WorkRequest;
    const sorted = sortRequests([
      make("done", "2026-11-03"),
      make("pending", "2026-11-01"),
      make("pending", "2026-11-04"),
      make("in_progress", "2026-11-02"),
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["in_progress2026-11-02", "pending2026-11-04", "pending2026-11-01", "done2026-11-03"]);
  });

  it("só abre ligações http e https", () => {
    expect(safeResultUrl("https://exemplo.pt/s/barbearia")).toBe("https://exemplo.pt/s/barbearia");
    expect(safeResultUrl("javascript:alert(1)")).toBeNull();
    expect(safeResultUrl("nada")).toBeNull();
  });
});
