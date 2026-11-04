import type { Contact, ContactStatus } from "./rules";

// Linha do histórico de um contacto, escrita pela base de dados a cada mudança de estado.
export type ContactEvent = {
  contact_id: string;
  kind: "created" | "status";
  status: ContactStatus;
  created_at: string;
};

export const PACE_DAYS = 14;
export const DEFAULT_DAILY_GOAL = 10;
export const MAX_DAILY_GOAL = 200;
const DAY_MS = 86_400_000;

const lisbonDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Lisbon",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Dia no calendário de Lisboa, como "2026-11-04".
export function dayOf(date: string | number | Date) {
  return lisbonDay.format(new Date(date));
}

export function parseDailyGoal(value: unknown) {
  const goal = typeof value === "string" ? Number(value.trim()) : value;
  return typeof goal === "number" &&
    Number.isInteger(goal) &&
    goal >= 1 &&
    goal <= MAX_DAILY_GOAL
    ? goal
    : null;
}

// Empresas contactadas por dia: cada empresa conta uma vez por dia, mesmo que o
// estado mude várias vezes.
export function dailyPace(events: ContactEvent[], now: number, days = PACE_DAYS) {
  const counts = new Map<string, Set<string>>();
  for (const event of events) {
    if (event.kind !== "status" || event.status !== "contacted") continue;
    const day = dayOf(event.created_at);
    if (!counts.has(day)) counts.set(day, new Set());
    counts.get(day)!.add(event.contact_id);
  }

  // Ao meio-dia UTC, para não saltar nem repetir dias na mudança de hora.
  const today = dayOf(now);
  const base = new Date(`${today}T12:00:00Z`).getTime();
  return Array.from({ length: days }, (_, index) => {
    const day = dayOf(base - (days - 1 - index) * DAY_MS);
    return { day, count: counts.get(day)?.size ?? 0 };
  });
}

export function contactedToday(events: ContactEvent[], now: number) {
  return dailyPace(events, now, 1)[0].count;
}

const CLOSED: ContactStatus[] = ["won", "lost"];

function isWorkable(contact: Contact) {
  return !contact.do_not_contact && !CLOSED.includes(contact.status);
}

// Retornos marcados para hoje ou já passados, do mais antigo para o mais recente.
export function dueReturns(contacts: Contact[], now: number) {
  const today = dayOf(now);
  return contacts
    .filter(
      (contact) =>
        isWorkable(contact) &&
        contact.next_action_at !== null &&
        contact.next_action_at <= today,
    )
    .sort((a, b) => a.next_action_at!.localeCompare(b.next_action_at!));
}

// Próxima da fila: a empresa por contactar guardada há mais tempo, sem as que se
// saltaram nesta visita.
export function nextInQueue(contacts: Contact[], skipped: ReadonlySet<string>) {
  return (
    contacts
      .filter(
        (contact) =>
          contact.status === "to_contact" &&
          !contact.do_not_contact &&
          !skipped.has(contact.id),
      )
      .sort((a, b) => a.created_at.localeCompare(b.created_at))[0] ?? null
  );
}

export function queueSize(contacts: Contact[]) {
  return contacts.filter(
    (contact) => contact.status === "to_contact" && !contact.do_not_contact,
  ).length;
}

// Valores escritos pelo freelancer: o que está em negociação e o que já fechou.
export function dealTotals(
  contacts: Pick<Contact, "status" | "deal_value" | "do_not_contact">[],
) {
  let open = 0;
  let won = 0;
  let openCount = 0;
  let wonCount = 0;
  for (const contact of contacts) {
    const value = Number(contact.deal_value ?? 0);
    if (!value) continue;
    if (contact.status === "won") {
      won += value;
      wonCount++;
    } else if (contact.status !== "lost" && !contact.do_not_contact) {
      open += value;
      openCount++;
    }
  }
  return { open, won, openCount, wonCount };
}
