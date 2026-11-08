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

// As próximas da fila, pela mesma ordem (a mais antiga primeiro).
export function queueList(contacts: Contact[], skipped: ReadonlySet<string>, limit = 5) {
  return contacts
    .filter((contact) => contact.status === "to_contact" && !contact.do_not_contact && !skipped.has(contact.id))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(0, limit);
}

// Retornos rápidos: hoje, amanhã, daqui a 3 dias ou a uma semana.
export const RETURN_DAYS = [0, 1, 3, 7] as const;
export type ReturnDays = (typeof RETURN_DAYS)[number];

export function isReturnDays(value: unknown): value is ReturnDays {
  return RETURN_DAYS.some((days) => days === value);
}

// O dia (AAAA-MM-DD) a `days` dias de `today`.
export function returnDate(today: string, days: number) {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export const STALLED_AFTER_DAYS = 7;

// Contactada, respondeu ou com proposta, e sem mexer há uma semana ou mais: os dias, ou null.
export function stalledFor(contact: Pick<Contact, "status" | "last_contacted_at" | "created_at" | "do_not_contact">, now: number) {
  if (!["contacted", "replied", "proposal"].includes(contact.status)) return null;
  const days = stalledDays(contact, now);
  return days !== null && days >= STALLED_AFTER_DAYS ? days : null;
}

// "Parada": por contactar ou à espera, sem mexer há mais de `days` dias.
export function stalledDays(contact: Pick<Contact, "status" | "last_contacted_at" | "created_at" | "do_not_contact">, now: number) {
  if (contact.do_not_contact || contact.status === "won" || contact.status === "lost") return null;
  const since = contact.last_contacted_at ?? contact.created_at;
  return Math.floor((now - new Date(since).getTime()) / 86_400_000);
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

// Mensagem do "Chamar no WhatsApp": {nome} passa a ser o nome da empresa.
export const MAX_WHATSAPP_TEMPLATE = 1000;

export function parseWhatsappTemplate(value: unknown) {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (text.length > MAX_WHATSAPP_TEMPLATE) return undefined;
  return text || null;
}

// {empresa} (ou {nome}) é o nome da empresa; {link_portfolio} (ou {portfolio}) o link do
// portfólio publicado; {link_demo} o link da demo. Sem link, a variável sai do texto.
export function fillTemplate(template: string, name: string, portfolio?: string | null, demo?: string | null) {
  return template
    .replace(/\{(nome|empresa)\}/gi, name)
    .replace(/\{(link_portfolio|portfolio)\}/gi, portfolio ?? "")
    .replace(/\{link_demo\}/gi, demo ?? "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([.,!?;:])/g, "$1")
    .trim();
}

// Filtros rápidos dos contactos.
export const CONTACT_FILTERS = ["all", "due", "stale", "valued", "blocked"] as const;
export type ContactFilter = (typeof CONTACT_FILTERS)[number];
export const STALE_AFTER_DAYS = 3;

export function filterContacts(contacts: Contact[], filter: ContactFilter, now: number) {
  switch (filter) {
    case "all":
      return contacts;
    case "due": {
      const due = new Set(dueReturns(contacts, now).map(({ id }) => id));
      return contacts.filter(({ id }) => due.has(id));
    }
    // Contactadas, sem resposta, há mais de 3 dias.
    case "stale":
      return contacts.filter(
        (contact) =>
          contact.status === "contacted" &&
          !contact.do_not_contact &&
          contact.last_contacted_at !== null &&
          now - new Date(contact.last_contacted_at).getTime() > STALE_AFTER_DAYS * DAY_MS,
      );
    case "valued":
      return contacts.filter((contact) => contact.deal_value !== null);
    case "blocked":
      return contacts.filter((contact) => contact.do_not_contact);
  }
}

// Folha para o Excel em português: separador ";", BOM e só o que o freelancer
// escreveu (os dados do Google não se guardam, por isso também não saem daqui).
export function contactsCsv(
  contacts: Contact[],
  headers: string[],
  statusName: (status: ContactStatus) => string,
) {
  const cell = (value: string | number | null | undefined) => {
    const text = value === null || value === undefined ? "" : String(value);
    // Evita que o Excel trate o texto como fórmula.
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return /[";\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const rows = contacts.map((contact) => [
    contact.label,
    statusName(contact.status),
    contact.manual_phone ?? contact.confirmed_contact,
    contact.manual_niche,
    contact.manual_locality,
    contact.manual_website,
    contact.deal_value === null ? null : String(contact.deal_value).replace(".", ","),
    contact.next_action,
    contact.next_action_at,
    contact.last_contacted_at ? dayOf(contact.last_contacted_at) : null,
    contact.do_not_contact ? "sim" : "",
    contact.notes,
  ]);
  return "\uFEFF" + [headers, ...rows].map((row) => row.map(cell).join(";")).join("\r\n");
}
