import { describe, expect, it } from "vitest";
import { ptPT } from "@/i18n/pt-PT";
import {
  CONTACT_STATUSES,
  isContactStatus,
  marksLastContact,
  MAX_CONFIRMED_CONTACT,
  MAX_LABEL,
  MAX_NOTES,
  parseCompanyId,
  parseContactDetails,
  parseContactLabel,
  searchContacts,
  sortContacts,
  type Contact,
} from "./rules";

function contact(values: Partial<Contact>): Contact {
  return {
    id: "1",
    company_id: "c",
    label: "Empresa",
    confirmed_contact: null,
    status: "to_contact",
    last_contacted_at: null,
    follow_up_at: null,
    next_action: null,
    next_action_at: null,
    notes: null,
    created_at: "2026-11-01T00:00:00Z",
    manual_niche: null,
    manual_locality: null,
    manual_address: null,
    manual_phone: null,
    manual_website: null,
    manual_reviews: null,
    manual_hours: null,
    ...values,
  };
}

const details = {
  label: " Barbearia do João ",
  confirmedContact: "",
  nextAction: " Ligar ",
  nextActionAt: "2026-11-20",
  notes: "",
};

describe("parseContactDetails", () => {
  it("limpa os espaços e guarda vazio como null", () => {
    expect(parseContactDetails(details)).toEqual({
      label: "Barbearia do João",
      confirmedContact: null,
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
    { ...details, label: "  " },
    { ...details, label: "a".repeat(MAX_LABEL + 1) },
    { ...details, confirmedContact: "a".repeat(MAX_CONFIRMED_CONTACT + 1) },
  ])("rejeita %j", (value) => {
    expect(parseContactDetails(value)).toBeNull();
  });
});

describe("o que o freelancer escreve", () => {
  it("aceita um nome e limpa os espaços", () => {
    expect(parseContactLabel("  Barbearia do João ")).toBe("Barbearia do João");
  });

  it.each(["", "   ", 3, null, "a".repeat(MAX_LABEL + 1)])(
    "rejeita o nome %j",
    (value) => {
      expect(parseContactLabel(value)).toBeNull();
    },
  );

  it("só aceita ids simples, como os do Google", () => {
    expect(parseCompanyId("ChIJ_abc-123")).toBe("ChIJ_abc-123");
    expect(parseCompanyId("../outro")).toBeNull();
    expect(parseCompanyId("")).toBeNull();
    expect(parseCompanyId(3)).toBeNull();
  });

  it("o contacto não tem campos para dados do Google", () => {
    const fields = Object.keys(contact({}));
    for (const field of ["company_name", "niche", "locality", "address", "phone", "website", "score"]) {
      expect(fields).not.toContain(field);
    }
  });
});

describe("searchContacts", () => {
  const list = [
    contact({ id: "1", label: "Clínica Sorriso", notes: "Fica em Lisboa" }),
    contact({ id: "2", label: "Barbearia Horizonte" }),
  ];

  it("ignora maiúsculas e acentos", () => {
    expect(searchContacts(list, "CLINICA").map(({ id }) => id)).toEqual(["1"]);
  });

  it("procura também nas notas", () => {
    expect(searchContacts(list, "lisboa").map(({ id }) => id)).toEqual(["1"]);
  });

  it("sem pesquisa devolve todos", () => {
    expect(searchContacts(list, "  ")).toHaveLength(2);
  });
});

describe("sortContacts", () => {
  const list = [
    contact({ id: "a", label: "Zeta", status: "won" }),
    contact({
      id: "b",
      label: "Águia",
      next_action_at: "2026-12-01",
    }),
    contact({
      id: "c",
      label: "Beta",
      status: "replied",
      next_action_at: "2026-11-01",
    }),
  ];
  const ids = (key: Parameters<typeof sortContacts>[1], dir: "asc" | "desc") =>
    sortContacts(list, key, dir).map(({ id }) => id);

  it("ordena nomes com acentos", () => {
    expect(ids("name", "asc")).toEqual(["b", "c", "a"]);
  });

  it("ordena pela ordem do quadro", () => {
    expect(ids("status", "asc")).toEqual(["b", "c", "a"]);
  });

  it("sem próxima ação fica sempre no fim", () => {
    expect(ids("nextAction", "asc")).toEqual(["c", "b", "a"]);
    expect(ids("nextAction", "desc")).toEqual(["b", "c", "a"]);
  });

  it("não altera a lista original", () => {
    sortContacts(list, "name", "asc");
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
