import { describe, expect, it } from "vitest";
import { parsePaymentInput, projectBalance, receivedByMonth, toReceive, type ProjectPayment } from "./payments";

const P1 = "11111111-1111-4111-8111-111111111111";
const P2 = "22222222-2222-4222-8222-222222222222";
const pay = (project_id: string, amount: number | string, paid_on: string, kind: ProjectPayment["kind"] = "build"): ProjectPayment => ({
  id: `${project_id}-${paid_on}-${amount}`,
  project_id,
  kind,
  amount,
  paid_on,
  note: null,
  created_at: `${paid_on}T10:00:00Z`,
});

describe("parsePaymentInput", () => {
  const base = { projectId: P1, kind: "build", amount: "300,50", paidOn: "2026-11-05", note: " sinal " };
  it("aceita valor em euros, data e nota", () => {
    expect(parsePaymentInput(base, "2026-11-07")).toEqual({
      ok: true,
      input: { projectId: P1, kind: "build", amount: 300.5, paidOn: "2026-11-05", note: "sinal" },
    });
  });
  it("recusa valor zero, vazio ou inválido", () => {
    expect(parsePaymentInput({ ...base, amount: "0" }, "2026-11-07")).toEqual({ ok: false, error: "amount" });
    expect(parsePaymentInput({ ...base, amount: "" }, "2026-11-07")).toEqual({ ok: false, error: "amount" });
    expect(parsePaymentInput({ ...base, amount: "abc" }, "2026-11-07")).toEqual({ ok: false, error: "amount" });
  });
  it("recusa datas inválidas e futuras", () => {
    expect(parsePaymentInput({ ...base, paidOn: "2026-02-30" }, "2026-11-07")).toEqual({ ok: false, error: "date" });
    expect(parsePaymentInput({ ...base, paidOn: "2026-11-08" }, "2026-11-07")).toEqual({ ok: false, error: "future" });
  });
  it("recusa projeto ou tipo inválidos, notas longas e segredos", () => {
    expect(parsePaymentInput({ ...base, projectId: "x" }, "2026-11-07")).toEqual({ ok: false, error: "required" });
    expect(parsePaymentInput({ ...base, kind: "tax" }, "2026-11-07")).toEqual({ ok: false, error: "required" });
    expect(parsePaymentInput({ ...base, note: "a".repeat(201) }, "2026-11-07")).toEqual({ ok: false, error: "tooLong" });
    expect(parsePaymentInput({ ...base, note: "senha: 1234" }, "2026-11-07")).toEqual({ ok: false, error: "secret" });
  });
});

describe("projectBalance e toReceive", () => {
  const projects = [
    { id: P1, status: "in_progress" as const, build_value: "1200.00" },
    { id: P2, status: "requested" as const, build_value: 800 },
  ];
  it("desconta só os pagamentos da criação do próprio projeto", () => {
    const payments = [pay(P1, 300, "2026-10-01"), pay(P1, 50, "2026-11-01", "maintenance"), pay(P2, 100, "2026-11-01")];
    expect(projectBalance(projects[0], payments)).toEqual({ build: 1200, paid: 300, remaining: 900 });
  });
  it("não conta projetos em pedido nem fica abaixo de zero", () => {
    expect(toReceive(projects, [pay(P1, 300, "2026-10-01")])).toEqual({ amount: 900, count: 1, hasPayments: true });
    expect(toReceive(projects, [pay(P1, 1500, "2026-10-01")])).toEqual({ amount: 0, count: 0, hasPayments: true });
  });
  it("sem pagamentos registados, avisa em vez de inventar", () => {
    expect(toReceive(projects, []).hasPayments).toBe(false);
  });
});

describe("receivedByMonth", () => {
  it("últimos 6 meses, do mais antigo ao atual, com zeros e a passar o ano", () => {
    const result = receivedByMonth([pay(P1, 100, "2026-01-15"), pay(P1, "50.5", "2026-01-20"), pay(P1, 999, "2025-07-01")], "2026-03-10");
    expect(result).toEqual([
      { month: "2025-10", total: 0 },
      { month: "2025-11", total: 0 },
      { month: "2025-12", total: 0 },
      { month: "2026-01", total: 150.5 },
      { month: "2026-02", total: 0 },
      { month: "2026-03", total: 0 },
    ]);
  });
});
