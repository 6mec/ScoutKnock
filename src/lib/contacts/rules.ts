export const CONTACT_STATUSES = [
  "to_contact",
  "contacted",
  "replied",
  "proposal",
  "won",
  "lost",
] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const MAX_NEXT_ACTION = 200;
export const MAX_NOTES = 2000;

export type Contact = {
  id: string;
  company_id: string;
  company_name: string;
  niche: string;
  locality: string;
  address: string;
  phone: string | null;
  website: string | null;
  score: number;
  status: ContactStatus;
  last_contacted_at: string | null;
  next_action: string | null;
  next_action_at: string | null;
  notes: string | null;
  created_at: string;
};

export type ContactDetails = {
  nextAction: string | null;
  nextActionAt: string | null;
  notes: string | null;
};

export type ContactSortKey = "name" | "score" | "status" | "nextAction";
export type SortDirection = "asc" | "desc";

export function isContactStatus(value: unknown): value is ContactStatus {
  return CONTACT_STATUSES.some((status) => status === value);
}

// Passar a estes estados significa que houve contacto com a empresa.
export function marksLastContact(status: ContactStatus) {
  return status === "contacted" || status === "replied" || status === "proposal";
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function parseContactDetails(value: unknown): ContactDetails | null {
  if (typeof value !== "object" || value === null) return null;

  const { nextAction, nextActionAt, notes } = value as Record<string, unknown>;
  if (
    typeof nextAction !== "string" ||
    typeof nextActionAt !== "string" ||
    typeof notes !== "string"
  ) {
    return null;
  }

  const action = nextAction.trim();
  const text = notes.trim();

  if (
    action.length > MAX_NEXT_ACTION ||
    text.length > MAX_NOTES ||
    (nextActionAt && !isValidDate(nextActionAt))
  ) {
    return null;
  }

  return {
    nextAction: action || null,
    nextActionAt: nextActionAt || null,
    notes: text || null,
  };
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

  return contacts.filter((contact) =>
    normalize(
      `${contact.company_name} ${contact.niche} ${contact.locality}`,
    ).includes(wanted),
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
        return sign * a.company_name.localeCompare(b.company_name, "pt-PT");
      case "score":
        return sign * (a.score - b.score);
      case "status":
        return (
          sign *
          (CONTACT_STATUSES.indexOf(a.status) - CONTACT_STATUSES.indexOf(b.status))
        );
      case "nextAction":
        if (!a.next_action_at) return b.next_action_at ? 1 : 0;
        if (!b.next_action_at) return -1;
        return sign * a.next_action_at.localeCompare(b.next_action_at);
    }
  });
}
