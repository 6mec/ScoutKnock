import { describe, expect, it } from "vitest";
import {
  filterProjects,
  isLate,
  kindFromRequest,
  looksLikeSecret,
  nextDate,
  parseProjectFields,
  parseProjectInput,
  projectTotals,
  safeProjectUrl,
  sortProjects,
  valueForInput,
  type ClientProject,
} from "./rules";

const base = {
  companyName: "Barbearia do Zé",
  name: "Site com marcações",
  kind: "site_booking",
  status: "in_progress",
};

function project(overrides: Partial<ClientProject>): ClientProject {
  return {
    id: crypto.randomUUID(),
    contact_id: null,
    work_request_id: null,
    company_name: "Empresa",
    name: "Site",
    kind: "site",
    status: "requested",
    build_value: null,
    third_party_value: null,
    third_party_note: null,
    maintenance_monthly: null,
    start_date: null,
    due_date: null,
    delivered_on: null,
    maintenance_since: null,
    link: null,
    notes: null,
    created_at: "2026-11-01T10:00:00Z",
    updated_at: "2026-11-01T10:00:00Z",
    ...overrides,
  };
}

describe("parseProjectFields", () => {
  it("aceita o mínimo e põe o resto a null", () => {
    const result = parseProjectFields(base);
    expect(result).toEqual({
      ok: true,
      fields: expect.objectContaining({
        companyName: "Barbearia do Zé",
        buildValue: null,
        startDate: null,
        notes: null,
      }),
    });
  });

  it("lê euros à portuguesa", () => {
    const result = parseProjectFields({
      ...base,
      buildValue: "1.200,50",
      thirdPartyValue: "45 €",
      maintenanceMonthly: "30",
    });
    expect(result.ok && result.fields).toMatchObject({
      buildValue: 1200.5,
      thirdPartyValue: 45,
      maintenanceMonthly: 30,
    });
  });

  it("recusa valores inválidos, negativos ou acima do limite", () => {
    expect(parseProjectFields({ ...base, buildValue: "abc" })).toEqual({ ok: false, error: "value" });
    expect(parseProjectFields({ ...base, buildValue: "-5" })).toEqual({ ok: false, error: "value" });
    expect(parseProjectFields({ ...base, maintenanceMonthly: "2000000" })).toEqual({ ok: false, error: "value" });
  });

  it("exige empresa, nome, tipo e estado válidos", () => {
    expect(parseProjectFields({ ...base, companyName: " " })).toEqual({ ok: false, error: "required" });
    expect(parseProjectFields({ ...base, kind: "loja" })).toEqual({ ok: false, error: "required" });
    expect(parseProjectFields({ ...base, status: "pago" })).toEqual({ ok: false, error: "required" });
    expect(parseProjectFields(null)).toEqual({ ok: false, error: "required" });
  });

  it("valida as datas e a ordem delas", () => {
    expect(parseProjectFields({ ...base, startDate: "2026-02-30" })).toEqual({ ok: false, error: "date" });
    expect(parseProjectFields({ ...base, startDate: "2026-11-10", dueDate: "2026-11-01" })).toEqual({
      ok: false,
      error: "dueBeforeStart",
    });
    expect(parseProjectFields({ ...base, startDate: "2026-11-10", deliveredOn: "2026-11-09" })).toEqual({
      ok: false,
      error: "deliveredBeforeStart",
    });
    expect(parseProjectFields({ ...base, startDate: "2026-11-01", dueDate: "2026-11-30" }).ok).toBe(true);
  });

  it("recusa textos longos de mais", () => {
    expect(parseProjectFields({ ...base, notes: "x".repeat(4001) })).toEqual({ ok: false, error: "tooLong" });
    expect(parseProjectFields({ ...base, link: "x".repeat(301) })).toEqual({ ok: false, error: "tooLong" });
  });

  it("recusa palavras-passe e chaves nas notas e na ligação", () => {
    expect(parseProjectFields({ ...base, notes: "Painel do alojamento, senha: abc123" })).toEqual({
      ok: false,
      error: "secret",
    });
    expect(parseProjectFields({ ...base, link: "https://admin:segredo@exemplo.pt" })).toEqual({
      ok: false,
      error: "secret",
    });
    expect(parseProjectFields({ ...base, notes: "Chave sk_live_abcdefgh12345678" })).toEqual({
      ok: false,
      error: "secret",
    });
  });
});

describe("looksLikeSecret", () => {
  it("não confunde frases normais", () => {
    expect(looksLikeSecret("O cliente muda a palavra-passe do alojamento sozinho.")).toBe(false);
    expect(looksLikeSecret("Domínio na conta do cliente; ele guarda os acessos.")).toBe(false);
    expect(looksLikeSecret(null)).toBe(false);
  });

  it("apanha as formas comuns", () => {
    expect(looksLikeSecret("password=hunter2")).toBe(true);
    expect(looksLikeSecret("Palavra-passe: 1234")).toBe(true);
    expect(looksLikeSecret("token: ghp_abcdefghijklmnopqrstuv")).toBe(true);
    expect(looksLikeSecret("AKIAABCDEFGHIJKLMNOP")).toBe(true);
  });
});

describe("parseProjectInput", () => {
  it("aceita ficha e pedido como uuid ou vazio", () => {
    const id = crypto.randomUUID();
    const result = parseProjectInput({ ...base, contactId: id, workRequestId: "" });
    expect(result.ok && result.input).toMatchObject({ contactId: id, workRequestId: null });
    expect(parseProjectInput({ ...base, contactId: "1; drop" })).toEqual({ ok: false, error: "required" });
  });
});

describe("datas e somas", () => {
  const today = "2026-11-04";

  it("atrasado só antes da entrega e com a data prevista passada", () => {
    expect(isLate(project({ status: "in_progress", due_date: "2026-11-03" }), today)).toBe(true);
    expect(isLate(project({ status: "in_progress", due_date: "2026-11-04" }), today)).toBe(false);
    expect(isLate(project({ status: "delivered", due_date: "2026-11-01" }), today)).toBe(false);
    expect(isLate(project({ status: "requested", due_date: "2026-11-01", delivered_on: "2026-11-01" }), today)).toBe(false);
    expect(isLate(project({ status: "requested" }), today)).toBe(false);
  });

  it("mostra a data que interessa em cada estado", () => {
    expect(nextDate(project({ status: "in_progress", due_date: "2026-12-01" }))).toEqual({ kind: "due", date: "2026-12-01" });
    expect(nextDate(project({ status: "delivered", delivered_on: "2026-11-02" }))).toEqual({
      kind: "delivered",
      date: "2026-11-02",
    });
    expect(nextDate(project({ status: "maintenance", maintenance_since: "2026-11-05" }))).toEqual({
      kind: "maintenance",
      date: "2026-11-05",
    });
    expect(nextDate(project({ status: "requested" }))).toBeNull();
  });

  it("soma só a criação entregue e a manutenção em curso", () => {
    const totals = projectTotals([
      project({ build_value: "800.00", delivered_on: "2026-10-01", status: "maintenance", maintenance_monthly: "30.00" }),
      project({ build_value: 1200.5, delivered_on: "2026-10-20", status: "delivered", maintenance_monthly: 25 }),
      project({ build_value: 500, status: "in_progress" }),
      project({ build_value: null, delivered_on: "2026-09-01", status: "finished" }),
    ]);
    expect(totals).toEqual({ build: 2000.5, buildCount: 2, maintenance: 30, maintenanceCount: 1 });
  });

  it("ordena em curso primeiro e os atrasados à frente", () => {
    const late = project({ status: "in_progress", due_date: "2026-11-01", name: "atrasado" });
    const soon = project({ status: "in_progress", due_date: "2026-11-20", name: "cedo" });
    const done = project({ status: "finished", name: "terminado" });
    const asked = project({ status: "requested", name: "pedido" });
    expect(sortProjects([done, asked, soon, late], today).map(({ name }) => name)).toEqual([
      "atrasado",
      "cedo",
      "pedido",
      "terminado",
    ]);
  });

  it("filtra por estado e procura sem acentos", () => {
    const list = [
      project({ company_name: "Barbearia do Zé", status: "in_progress" }),
      project({ company_name: "Café Central", status: "maintenance" }),
    ];
    expect(filterProjects(list, "all", "ze")).toHaveLength(1);
    expect(filterProjects(list, "maintenance", "")).toHaveLength(1);
    expect(filterProjects(list, "delivered", "")).toHaveLength(0);
  });
});

describe("ajudas", () => {
  it("só abre ligações http(s)", () => {
    expect(safeProjectUrl("https://barbearia.pt")).toBe("https://barbearia.pt/");
    expect(safeProjectUrl("javascript:alert(1)")).toBeNull();
    expect(safeProjectUrl("../ScoutKnock-clientes/barbearia")).toBeNull();
  });

  it("mostra os valores com vírgula e traz o tipo do pedido", () => {
    expect(valueForInput("1200.50")).toBe("1200,5");
    expect(valueForInput(null)).toBe("");
    expect(kindFromRequest("app")).toBe("app");
    expect(kindFromRequest("loja")).toBe("other");
  });
});
