import { describe, expect, it } from "vitest";
import {
  billingTasks,
  checklistTemplate,
  datesForPhase,
  kindFromService,
  originFromContact,
  phaseForStatus,
  projectFromDeal,
  statusForPhase,
} from "./cycle";
import { projectBalance, receivedByMonth, toReceive, type ProjectPayment } from "./payments";

const contact = {
  id: "c1",
  label: "Barbearia Antiga",
  company_id: "osm-node-123",
  manual_niche: "Barbearias",
  manual_locality: "Viseu",
  deal_value: 500,
};

describe("ciclo do projeto", () => {
  it("a fase manda no estado", () => {
    expect(statusForPhase("accepted")).toBe("in_progress");
    expect(statusForPhase("review")).toBe("in_progress");
    expect(statusForPhase("delivery")).toBe("delivered");
    expect(statusForPhase("maintenance")).toBe("maintenance");
    expect(phaseForStatus("requested")).toBeNull();
    expect(phaseForStatus("finished")).toBe("delivery");
  });

  it("entrar na entrega ou na manutenção preenche só as datas vazias", () => {
    const blank = { start_date: null, delivered_on: null, maintenance_since: null };
    expect(datesForPhase("accepted", blank, "2026-11-08")).toEqual({});
    expect(datesForPhase("maintenance", blank, "2026-11-08")).toEqual({
      start_date: "2026-11-08",
      delivered_on: "2026-11-08",
      maintenance_since: "2026-11-08",
    });
    expect(datesForPhase("delivery", { start_date: "2026-10-01", delivered_on: "2026-11-01", maintenance_since: null }, "2026-11-08")).toEqual({});
  });

  it("a checklist acaba sempre a pedir a opinião", () => {
    for (const kind of ["site", "site_booking", "app", "other"] as const) {
      const items = checklistTemplate(kind);
      expect(items.at(-1)?.kind).toBe("ask_testimonial");
      expect(items.filter((item) => item.kind === "ask_testimonial")).toHaveLength(1);
    }
  });

  it("a origem vem da ficha", () => {
    expect(originFromContact(contact)).toEqual({ origin_source: "osm", origin_niche: "Barbearias", origin_locality: "Viseu" });
    expect(originFromContact({ company_id: "manual-1", manual_niche: null, manual_locality: null }).origin_source).toBe("manual");
    expect(originFromContact({ company_id: "ChIJabc", manual_niche: null, manual_locality: null }).origin_source).toBe("google");
  });

  it("o tipo do projeto sai do serviço da proposta", () => {
    expect(kindFromService("App de marcações")).toBe("app");
    expect(kindFromService("Site com marcações online")).toBe("site_booking");
    expect(kindFromService("Site institucional")).toBe("site");
    expect(kindFromService(null)).toBe("site");
  });

  it("o negócio fechado cria o projeto com valor, sinal e final previstos", () => {
    const plan = projectFromDeal({ contact, proposal: { id: "p1", service: "Site com marcações", value: "900", deposit: "300" } }, "2026-11-08");
    expect(plan.row).toMatchObject({
      contact_id: "c1",
      proposal_id: "p1",
      company_name: "Barbearia Antiga",
      name: "Site com marcações",
      kind: "site_booking",
      status: "in_progress",
      phase: "accepted",
      build_value: 900,
      start_date: "2026-11-08",
      origin_source: "osm",
      origin_niche: "Barbearias",
    });
    expect(plan.payments).toEqual([
      { kind: "deposit", amount: 300, due_on: "2026-11-08" },
      { kind: "final", amount: 600, due_on: null },
    ]);
    expect(plan.checklist.length).toBeGreaterThan(2);
  });

  it("sem proposta usa o valor da ficha e não inventa sinal", () => {
    const plan = projectFromDeal({ contact, proposal: null }, "2026-11-08");
    expect(plan.row.build_value).toBe(500);
    expect(plan.row.proposal_id).toBeNull();
    expect(plan.payments).toEqual([{ kind: "final", amount: 500, due_on: null }]);
    const noValue = projectFromDeal({ contact: { ...contact, deal_value: null }, proposal: null }, "2026-11-08");
    expect(noValue.payments).toEqual([]);
  });
});

const payment = (over: Partial<ProjectPayment>): ProjectPayment => ({
  id: Math.random().toString(36),
  project_id: "pr1",
  kind: "build",
  amount: 100,
  paid_on: "2026-11-01",
  note: null,
  created_at: "2026-11-01T10:00:00Z",
  status: "received",
  due_on: null,
  ...over,
});

describe("cobranças", () => {
  const project = { id: "pr1", company_name: "Café", status: "in_progress" as const, maintenance_monthly: null, maintenance_since: null, delivered_on: null };

  it("os previstos com data entram; o final sem data só depois da entrega", () => {
    const pays = [
      payment({ kind: "deposit", status: "expected", paid_on: null, due_on: "2026-11-05", amount: 300 }),
      payment({ kind: "final", status: "expected", paid_on: null, due_on: null, amount: 600 }),
    ];
    const tasks = billingTasks([project], pays, "2026-11-08");
    expect(tasks).toEqual([{ kind: "billing", projectId: "pr1", company: "Café", label: "deposit", amount: 300, date: "2026-11-05", overdue: true }]);
    const delivered = billingTasks([{ ...project, status: "delivered", delivered_on: "2026-11-07" }], pays, "2026-11-08");
    expect(delivered.map((task) => task.label)).toEqual(["deposit", "final"]);
  });

  it("a manutenção do mês aparece até haver pagamento recebido nesse mês", () => {
    const maint = { ...project, status: "maintenance" as const, maintenance_monthly: "25", maintenance_since: "2026-09-01" };
    expect(billingTasks([maint], [], "2026-11-08")).toEqual([
      { kind: "billing", projectId: "pr1", company: "Café", label: "maintenance", amount: 25, date: "2026-11-01", overdue: false },
    ]);
    expect(billingTasks([maint], [payment({ kind: "maintenance", paid_on: "2026-11-03" })], "2026-11-08")).toEqual([]);
    expect(billingTasks([maint], [payment({ kind: "maintenance", paid_on: "2026-10-03" })], "2026-11-08")).toHaveLength(1);
    expect(billingTasks([{ ...maint, maintenance_since: "2026-12-01" }], [], "2026-11-08")).toEqual([]);
  });

  it("um projeto terminado não pede cobranças", () => {
    const pays = [payment({ kind: "deposit", status: "expected", paid_on: null, due_on: "2026-11-05" })];
    expect(billingTasks([{ ...project, status: "finished" }], pays, "2026-11-08")).toEqual([]);
  });
});

describe("pagamentos previstos não contam como recebidos", () => {
  it("saldo, a receber e recebido por mês ignoram os previstos", () => {
    const pays = [
      payment({ kind: "deposit", amount: 300, paid_on: "2026-11-02" }),
      payment({ kind: "final", amount: 600, status: "expected", paid_on: null }),
    ];
    expect(projectBalance({ id: "pr1", build_value: 900 }, pays)).toEqual({ build: 900, paid: 300, remaining: 600 });
    expect(toReceive([{ id: "pr1", status: "in_progress", build_value: 900 }], pays)).toEqual({ amount: 600, count: 1, hasPayments: true });
    expect(receivedByMonth(pays, "2026-11-08", 1)).toEqual([{ month: "2026-11", total: 300 }]);
    expect(toReceive([{ id: "pr1", status: "in_progress", build_value: 900 }], [pays[1]]).hasPayments).toBe(false);
  });
});
