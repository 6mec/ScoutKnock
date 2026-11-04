import { describe, expect, it } from "vitest";
import { whatsappNumber } from "@/lib/messages/rules";
import {
  contactsCsv,
  fillTemplate,
  filterContacts,
  MAX_WHATSAPP_TEMPLATE,
  parseWhatsappTemplate,
} from "./crm";
import type { Contact } from "./rules";

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
    deal_value: null,
    do_not_contact: false,
    ...values,
  };
}

const NOW = new Date("2026-11-10T10:00:00Z").getTime();

describe("modelo do WhatsApp", () => {
  it("troca {nome} pelo nome da empresa, em maiúsculas ou minúsculas", () => {
    expect(fillTemplate("Olá {nome}! Vi a {NOME}.", "Café Central")).toBe(
      "Olá Café Central! Vi a Café Central.",
    );
  });

  it("põe o link do portfólio em {portfolio} e tira-o quando não há", () => {
    const template = "Olá {nome}! Vê o meu trabalho em {portfolio} .";
    expect(fillTemplate(template, "Café", "https://x.pt/p/daniel")).toBe(
      "Olá Café! Vê o meu trabalho em https://x.pt/p/daniel.",
    );
    expect(fillTemplate("Olá {nome}! {portfolio}", "Café", null)).toBe("Olá Café!");
  });

  it("vazio é null; demasiado longo ou não texto é recusado", () => {
    expect(parseWhatsappTemplate("   ")).toBeNull();
    expect(parseWhatsappTemplate(" Olá ")).toBe("Olá");
    expect(parseWhatsappTemplate("a".repeat(MAX_WHATSAPP_TEMPLATE + 1))).toBeUndefined();
    expect(parseWhatsappTemplate(3)).toBeUndefined();
  });
});

describe("whatsappNumber", () => {
  it.each([
    ["912 345 678", "351912345678"],
    ["+351 912 345 678", "351912345678"],
    ["00351912345678", "351912345678"],
    ["351912345678", "351912345678"],
    ["+55 11 91234 5678", "5511912345678"],
    ["253 000 000", null],
    ["", null],
    [null, null],
  ])("%s → %s", (phone, expected) => {
    expect(whatsappNumber(phone)).toBe(expected);
  });
});

describe("filterContacts", () => {
  const list = [
    contact({ id: "retorno", next_action_at: "2026-11-09" }),
    contact({ id: "parado", status: "contacted", last_contacted_at: "2026-11-05T10:00:00Z" }),
    contact({ id: "recente", status: "contacted", last_contacted_at: "2026-11-09T10:00:00Z" }),
    contact({ id: "valor", status: "proposal", deal_value: 300 }),
    contact({ id: "bloqueado", do_not_contact: true, status: "contacted", last_contacted_at: "2026-11-01T10:00:00Z" }),
  ];
  const ids = (filter: Parameters<typeof filterContacts>[1]) =>
    filterContacts(list, filter, NOW).map(({ id }) => id);

  it("cada filtro mostra só o que diz", () => {
    expect(ids("all")).toHaveLength(5);
    expect(ids("due")).toEqual(["retorno"]);
    expect(ids("stale")).toEqual(["parado"]);
    expect(ids("valued")).toEqual(["valor"]);
    expect(ids("blocked")).toEqual(["bloqueado"]);
  });
});

describe("contactsCsv", () => {
  it("usa ';', BOM, aspas quando é preciso e trava fórmulas", () => {
    const csv = contactsCsv(
      [
        contact({
          label: 'Café "Central"; Porto',
          manual_phone: "912 345 678",
          deal_value: 1200.5,
          notes: "=SOMA(A1)",
          do_not_contact: true,
        }),
      ],
      ["Nome", "Estado"],
      () => "Por contactar",
    );
    expect(csv.startsWith("﻿Nome;Estado\r\n")).toBe(true);
    const row = csv.split("\r\n")[1];
    expect(row).toContain('"Café ""Central""; Porto";Por contactar;912 345 678');
    expect(row).toContain(";1200,5;");
    expect(row).toContain(";sim;'=SOMA(A1)");
  });
});
