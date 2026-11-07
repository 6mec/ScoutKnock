import { describe, expect, it } from "vitest";
import { deliveredThisMonth, funnel, salesOfMonth, upcomingTasks } from "./metrics";

const project = (over: Record<string, unknown>) =>
  ({
    id: "p",
    company_name: "Empresa",
    name: "Site",
    status: "in_progress",
    build_value: null,
    start_date: null,
    due_date: null,
    delivered_on: null,
    created_at: "2026-11-01T10:00:00Z",
    ...over,
  }) as never;

describe("salesOfMonth", () => {
  it("conta pela data de início, com a criação do registo como reserva, sem os pedidos", () => {
    const projects = [
      project({ build_value: "1000", start_date: "2026-11-03" }),
      project({ build_value: 500, start_date: "2026-10-30", created_at: "2026-11-02T10:00:00Z" }),
      project({ build_value: 300, created_at: "2026-11-05T10:00:00Z" }),
      project({ build_value: 700, status: "requested", start_date: "2026-11-04" }),
      // 31/10 às 23:30 em Lisboa já é 31/10 (UTC 23:30, horário de inverno).
      project({ build_value: 50, created_at: "2026-10-31T23:30:00Z" }),
    ];
    expect(salesOfMonth(projects, "2026-11-07")).toEqual({ amount: 1300, count: 2 });
  });
  it("sem projetos, zero", () => {
    expect(salesOfMonth([], "2026-11-07")).toEqual({ amount: 0, count: 0 });
  });
});

describe("deliveredThisMonth", () => {
  it("conta pela data de entrega feita", () => {
    const projects = [
      project({ delivered_on: "2026-11-02", build_value: 400 }),
      project({ delivered_on: "2026-10-28", build_value: 900 }),
      project({ build_value: 100 }),
    ];
    expect(deliveredThisMonth(projects, "2026-11-07")).toEqual({ count: 1, amount: 400 });
  });
});

describe("funnel", () => {
  const event = (contact_id: string, status: string, created_at: string) => ({ contact_id, status, created_at });
  it("cada contacto conta até à etapa mais avançada, só nos últimos 90 dias", () => {
    const events = [
      event("a", "contacted", "2026-10-01T10:00:00Z"),
      event("a", "replied", "2026-10-03T10:00:00Z"),
      event("b", "proposal", "2026-11-01T10:00:00Z"),
      event("c", "contacted", "2026-11-02T10:00:00Z"),
      event("c", "lost", "2026-11-03T10:00:00Z"),
      event("d", "won", "2026-11-04T10:00:00Z"),
      event("e", "won", "2026-06-01T10:00:00Z"),
      event("f", "to_contact", "2026-11-01T10:00:00Z"),
    ];
    expect(funnel(events, "2026-11-07")).toEqual([
      { stage: "contacted", count: 4 },
      { stage: "replied", count: 3 },
      { stage: "proposal", count: 2 },
      { stage: "won", count: 1 },
    ]);
  });
  it("sem histórico, tudo a zero", () => {
    expect(funnel([], "2026-11-07").every((item) => item.count === 0)).toBe(true);
  });
});

describe("upcomingTasks", () => {
  it("junta ações dos contactos e entregas por fazer, atrasadas primeiro", () => {
    const contacts = [
      { id: "c1", label: "Café Sol", next_action: "Ligar", next_action_at: "2026-11-09", status: "contacted" },
      { id: "c2", label: "Barbearia", next_action: "Enviar proposta", next_action_at: "2026-11-05", status: "replied" },
      { id: "c3", label: "Ganho", next_action: "x", next_action_at: "2026-11-08", status: "won" },
      { id: "c4", label: "Não contactar", next_action: "x", next_action_at: "2026-11-08", status: "contacted", do_not_contact: true },
    ];
    const projects = [
      project({ id: "p1", company_name: "Luluzote", due_date: "2026-11-08" }),
      project({ id: "p2", company_name: "Entregue", due_date: "2026-11-01", delivered_on: "2026-11-02", status: "delivered" }),
    ];
    const tasks = upcomingTasks(contacts, projects, "2026-11-07");
    expect(tasks.map((task) => [task.kind, task.id, task.overdue])).toEqual([
      ["contact", "c2", true],
      ["project", "p1", false],
      ["contact", "c1", false],
    ]);
  });
});
