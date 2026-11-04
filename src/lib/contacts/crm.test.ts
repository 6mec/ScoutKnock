import { describe, expect, it } from "vitest";
import {
  contactedToday,
  dailyPace,
  dayOf,
  dealTotals,
  dueReturns,
  nextInQueue,
  parseDailyGoal,
  queueSize,
  type ContactEvent,
} from "./crm";
import { parseDealValue, type Contact } from "./rules";

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

const contacted = (id: string, at: string): ContactEvent => ({
  contact_id: id,
  kind: "status",
  status: "contacted",
  created_at: at,
});

const NOW = new Date("2026-11-04T10:00:00Z").getTime();

describe("dayOf", () => {
  it("usa o calendário de Lisboa", () => {
    // 23h30 UTC no verão já é o dia seguinte em Lisboa.
    expect(dayOf("2026-07-01T23:30:00Z")).toBe("2026-07-02");
    expect(dayOf("2026-12-01T23:30:00Z")).toBe("2026-12-01");
  });
});

describe("dailyPace", () => {
  it("devolve 14 dias a acabar hoje, sem saltar a mudança de hora", () => {
    const pace = dailyPace([], NOW);
    expect(pace).toHaveLength(14);
    expect(pace.at(-1)?.day).toBe("2026-11-04");
    expect(pace[0].day).toBe("2026-10-22");
    expect(new Set(pace.map(({ day }) => day)).size).toBe(14);
  });

  it("conta cada empresa uma vez por dia e ignora outros estados", () => {
    const events: ContactEvent[] = [
      contacted("a", "2026-11-04T09:00:00Z"),
      contacted("a", "2026-11-04T09:30:00Z"),
      contacted("b", "2026-11-04T08:00:00Z"),
      contacted("c", "2026-11-03T08:00:00Z"),
      { contact_id: "d", kind: "status", status: "replied", created_at: "2026-11-04T08:00:00Z" },
      { contact_id: "e", kind: "created", status: "to_contact", created_at: "2026-11-04T08:00:00Z" },
    ];
    const pace = dailyPace(events, NOW);
    expect(pace.at(-1)?.count).toBe(2);
    expect(pace.at(-2)?.count).toBe(1);
    expect(contactedToday(events, NOW)).toBe(2);
  });
});

describe("parseDailyGoal", () => {
  it.each([
    ["10", 10],
    [25, 25],
    ["0", null],
    ["201", null],
    ["2.5", null],
    ["abc", null],
  ])("%s → %s", (value, expected) => {
    expect(parseDailyGoal(value)).toBe(expected);
  });
});

describe("parseDealValue", () => {
  it.each([
    ["", null],
    ["300", 300],
    ["300 €", 300],
    ["1.200", 1200],
    ["1.200,50", 1200.5],
    ["1200.5", 1200.5],
    ["99,9", 99.9],
    ["10.123", 10123],
  ])("%s → %s", (value, expected) => {
    expect(parseDealValue(value)).toBe(expected);
  });

  it.each(["-5", "abc", "1,2,3", "2000000", "10.12345"])("recusa %s", (value) => {
    expect(parseDealValue(value)).toBeUndefined();
  });
});

describe("dueReturns", () => {
  it("mostra os de hoje e os atrasados, sem fechados nem 'não contactar'", () => {
    const list = [
      contact({ id: "hoje", next_action_at: "2026-11-04" }),
      contact({ id: "atrasado", next_action_at: "2026-11-01" }),
      contact({ id: "amanha", next_action_at: "2026-11-05" }),
      contact({ id: "ganho", status: "won", next_action_at: "2026-11-01" }),
      contact({ id: "nao", do_not_contact: true, next_action_at: "2026-11-01" }),
      contact({ id: "sem" }),
    ];
    expect(dueReturns(list, NOW).map(({ id }) => id)).toEqual(["atrasado", "hoje"]);
  });
});

describe("nextInQueue", () => {
  const list = [
    contact({ id: "novo", created_at: "2026-11-03T00:00:00Z" }),
    contact({ id: "antigo", created_at: "2026-11-01T00:00:00Z" }),
    contact({ id: "nao", do_not_contact: true, created_at: "2026-10-01T00:00:00Z" }),
    contact({ id: "contactado", status: "contacted", created_at: "2026-10-01T00:00:00Z" }),
  ];

  it("escolhe a mais antiga por contactar", () => {
    expect(nextInQueue(list, new Set())?.id).toBe("antigo");
    expect(queueSize(list)).toBe(2);
  });

  it("salta as que se saltaram e acaba em null", () => {
    expect(nextInQueue(list, new Set(["antigo"]))?.id).toBe("novo");
    expect(nextInQueue(list, new Set(["antigo", "novo"]))).toBeNull();
  });
});

describe("dealTotals", () => {
  it("separa o que está em negociação do que fechou", () => {
    expect(
      dealTotals([
        contact({ status: "proposal", deal_value: 300 }),
        contact({ status: "replied", deal_value: 150.5 }),
        contact({ status: "won", deal_value: 500 }),
        contact({ status: "lost", deal_value: 900 }),
        contact({ status: "proposal", deal_value: 100, do_not_contact: true }),
        contact({ status: "proposal" }),
      ]),
    ).toEqual({ open: 450.5, won: 500, openCount: 2, wonCount: 1 });
  });
});
