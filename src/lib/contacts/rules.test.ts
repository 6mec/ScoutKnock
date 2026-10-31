import { describe, expect, it } from "vitest";
import { ptPT } from "@/i18n/pt-PT";
import {
  CONTACT_STATUSES,
  isContactStatus,
  marksLastContact,
  MAX_NOTES,
  parseContactDetails,
  searchContacts,
  sortContacts,
  type Contact,
} from "./rules";

function contact(values: Partial<Contact>): Contact {
  return {
    id: "1",
    company_id: "c",
    company_name: "Empresa",
    niche: "Barbearias",
    locality: "Porto",
    address: "Rua",
    phone: null,
    website: null,
    score: 50,
    status: "to_contact",
    last_contacted_at: null,
    next_action: null,
    next_action_at: null,
    notes: null,
    created_at: "2026-11-01T00:00:00Z",
    ...values,
  };
}

const details = { nextAction: " Ligar ", nextActionAt: "2026-11-20", notes: "" };

describe("parseContactDetails", () => {
  it("limpa os espaços e guarda vazio como null", () => {
    expect(parseContactDetails(details)).toEqual({
      nextAction: "Ligar",
      nextActionAt: "2026-11-20",
      notes: null,
    });
  });

  it("aceita a data vazia", () => {
    expect(parseContactDetails({ ...details, nextActionAt: "" })?.nextActionAt).toBeNull();
  });

  it.each([
    null,
    "texto",
    { ...details, nextActionAt: "20/11/2026" },
    { ...details, nextActionAt: "2026-02-31" },
    { ...details, notes: "a".repeat(MAX_NOTES + 1) },
    { ...details, nextAction: 3 },
  ])("rejeita %j", (value) => {
    expect(parseContactDetails(value)).toBeNull();
  });
});

describe("searchContacts", () => {
  const list = [
    contact({ id: "1", company_name: "Clínica Sorriso", locality: "Lisboa" }),
    contact({ id: "2", company_name: "Barbearia Horizonte" }),
  ];

  it("ignora maiúsculas e acentos", () => {
    expect(searchContacts(list, "CLINICA").map(({ id }) => id)).toEqual(["1"]);
  });

  it("procura também na localidade", () => {
    expect(searchContacts(list, "lisboa").map(({ id }) => id)).toEqual(["1"]);
  });

  it("sem pesquisa devolve todos", () => {
    expect(searchContacts(list, "  ")).toHaveLength(2);
  });
});

describe("sortContacts", () => {
  const list = [
    contact({ id: "a", company_name: "Zeta", score: 10, status: "won" }),
    contact({
      id: "b",
      company_name: "Águia",
      score: 90,
      next_action_at: "2026-12-01",
    }),
    contact({
      id: "c",
      company_name: "Beta",
      score: 40,
      status: "replied",
      next_action_at: "2026-11-01",
    }),
  ];
  const ids = (key: Parameters<typeof sortContacts>[1], dir: "asc" | "desc") =>
    sortContacts(list, key, dir).map(({ id }) => id);

  it("ordena nomes com acentos", () => {
    expect(ids("name", "asc")).toEqual(["b", "c", "a"]);
  });

  it("ordena pela nota", () => {
    expect(ids("score", "desc")).toEqual(["b", "c", "a"]);
  });

  it("ordena pela ordem do quadro", () => {
    expect(ids("status", "asc")).toEqual(["b", "c", "a"]);
  });

  it("sem próxima ação fica sempre no fim", () => {
    expect(ids("nextAction", "asc")).toEqual(["c", "b", "a"]);
    expect(ids("nextAction", "desc")).toEqual(["b", "c", "a"]);
  });

  it("não altera a lista original", () => {
    sortContacts(list, "score", "asc");
    expect(list[0].id).toBe("a");
  });
});

describe("estados", () => {
  it("têm todos um nome", () => {
    CONTACT_STATUSES.forEach((status) =>
      expect(ptPT.contacts.statuses[status]).toBeTruthy(),
    );
  });

  it("valida o estado", () => {
    expect(isContactStatus("won")).toBe(true);
    expect(isContactStatus("cliente")).toBe(false);
  });

  it("só alguns contam como contacto feito", () => {
    expect(marksLastContact("contacted")).toBe(true);
    expect(marksLastContact("lost")).toBe(false);
    expect(marksLastContact("to_contact")).toBe(false);
  });
});
