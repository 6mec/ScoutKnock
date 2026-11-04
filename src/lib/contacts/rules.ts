export const CONTACT_STATUSES = [
  "to_contact",
  "contacted",
  "replied",
  "proposal",
  "won",
  "lost",
] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const MAX_LABEL = 120;
export const MAX_CONFIRMED_CONTACT = 200;
export const MAX_NEXT_ACTION = 200;
export const MAX_NOTES = 2000;
export const MAX_DEAL_VALUE = 1_000_000;

// Só o place_id e o que o freelancer escreve. Nome, morada, telefone, site e nota
// do Google não se guardam: vêm na hora, ao abrir o contacto. Os campos manual_*
// só existem nas empresas adicionadas à mão e são escritos pelo freelancer.
export type Contact = {
  id: string;
  company_id: string;
  label: string;
  confirmed_contact: string | null;
  status: ContactStatus;
  last_contacted_at: string | null;
  follow_up_at: string | null;
  next_action: string | null;
  next_action_at: string | null;
  notes: string | null;
  created_at: string;
  manual_niche: string | null;
  manual_locality: string | null;
  manual_address: string | null;
  manual_phone: string | null;
  manual_website: string | null;
  manual_reviews: number | null;
  manual_hours: boolean | null;
  // Só em empresas do OpenStreetMap: dia em que a morada e o telefone vieram de lá.
  osm_data_on?: string | null;
  deal_value: number | null;
  do_not_contact: boolean;
};

export type ContactDetails = {
  label: string;
  confirmedContact: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  notes: string | null;
  dealValue: number | null;
  doNotContact: boolean;
};

export type ContactSortKey = "name" | "status" | "nextAction" | "value";
export type SortDirection = "asc" | "desc";

export function isContactStatus(value: unknown): value is ContactStatus {
  return CONTACT_STATUSES.some((status) => status === value);
}

// Passar a estes estados significa que houve contacto com a empresa.
export function marksLastContact(status: ContactStatus) {
  return status === "contacted" || status === "replied" || status === "proposal";
}

export const FOLLOW_UP_AFTER_DAYS = 3;
const DAY_MS = 86_400_000;

export type FollowUpState =
  | { kind: "none" }
  | { kind: "wait"; days: number }
  | { kind: "ready" }
  | { kind: "generated" };

// Um só seguimento por empresa, e só depois de dar tempo para responderem.
export function followUpState(
  contact: Pick<Contact, "status" | "last_contacted_at" | "follow_up_at">,
  now: number,
): FollowUpState {
  if (contact.follow_up_at) return { kind: "generated" };
  if (contact.status !== "contacted" || !contact.last_contacted_at) {
    return { kind: "none" };
  }

  const left =
    new Date(contact.last_contacted_at).getTime() + FOLLOW_UP_AFTER_DAYS * DAY_MS - now;
  return left <= 0
    ? { kind: "ready" }
    : { kind: "wait", days: Math.ceil(left / DAY_MS) };
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function parseContactLabel(value: unknown) {
  if (typeof value !== "string") return null;

  const label = value.trim();
  return label && label.length <= MAX_LABEL ? label : null;
}

export function parseCompanyId(value: unknown) {
  return typeof value === "string" && /^[\w-]{1,200}$/.test(value) ? value : null;
}

export function parseContactDetails(value: unknown): ContactDetails | null {
  if (typeof value !== "object" || value === null) return null;

  const { label, confirmedContact, nextAction, nextActionAt, notes, dealValue, doNotContact } =
    value as Record<string, unknown>;
  const parsedLabel = parseContactLabel(label);
  const deal = parseDealValue(dealValue);
  if (
    !parsedLabel ||
    typeof confirmedContact !== "string" ||
    typeof nextAction !== "string" ||
    typeof nextActionAt !== "string" ||
    typeof notes !== "string" ||
    typeof doNotContact !== "boolean" ||
    deal === undefined
  ) {
    return null;
  }

  const confirmed = confirmedContact.trim();
  const action = nextAction.trim();
  const text = notes.trim();

  if (
    confirmed.length > MAX_CONFIRMED_CONTACT ||
    action.length > MAX_NEXT_ACTION ||
    text.length > MAX_NOTES ||
    (nextActionAt && !isValidDate(nextActionAt))
  ) {
    return null;
  }

  return {
    label: parsedLabel,
    confirmedContact: confirmed || null,
    nextAction: action || null,
    nextActionAt: nextActionAt || null,
    notes: text || null,
    dealValue: deal,
    doNotContact,
  };
}

// Valor em euros escrito à portuguesa ("1.200,50", "1200.5", "300 €"). Vazio é null;
// inválido é undefined.
export function parseDealValue(value: unknown): number | null | undefined {
  if (value === null || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 && value <= MAX_DEAL_VALUE
      ? Math.round(value * 100) / 100
      : undefined;
  }
  if (typeof value !== "string") return undefined;

  let text = value.replace(/€|\s/g, "");
  if (!text) return null;
  if (text.includes(",")) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    text = text.replace(/\./g, "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return undefined;

  return parseDealValue(Number(text));
}

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function searchContacts(contacts: Contact[], search: string) {
  const wanted = normalize(search.trim());
  if (!wanted) return contacts;

  const digits = search.replace(/\D/g, "");

  return contacts.filter(
    (contact) =>
      normalize(`${contact.label} ${contact.notes ?? ""}`).includes(wanted) ||
      (digits.length >= 3 &&
        `${contact.manual_phone ?? ""} ${contact.confirmed_contact ?? ""}`
          .replace(/\D/g, "")
          .includes(digits)),
  );
}

// Sem próxima ação fica sempre no fim, seja qual for a direção.
export function sortContacts(
  contacts: Contact[],
  key: ContactSortKey,
  direction: SortDirection,
) {
  const sign = direction === "asc" ? 1 : -1;

  return [...contacts].sort((a, b) => {
    switch (key) {
      case "name":
        return sign * a.label.localeCompare(b.label, "pt-PT");
      case "status":
        return (
          sign *
          (CONTACT_STATUSES.indexOf(a.status) - CONTACT_STATUSES.indexOf(b.status))
        );
      case "nextAction":
        if (!a.next_action_at) return b.next_action_at ? 1 : 0;
        if (!b.next_action_at) return -1;
        return sign * a.next_action_at.localeCompare(b.next_action_at);
      case "value":
        if (a.deal_value === null) return b.deal_value === null ? 0 : 1;
        if (b.deal_value === null) return -1;
        return sign * (a.deal_value - b.deal_value);
    }
  });
}
