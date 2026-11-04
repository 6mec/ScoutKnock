// Pedidos de trabalho: o que o freelancer pede para fazer para uma empresa. Quem faz
// é o Claude Code, com o comando /pedidos. Só guarda o que o freelancer escreve.
export const REQUEST_KINDS = ["site", "site_booking", "app"] as const;
export type RequestKind = (typeof REQUEST_KINDS)[number];
export type RequestStatus = "pending" | "in_progress" | "done" | "cancelled";

export const MAX_BRIEF = 4000;
export const MAX_REQUEST_COMPANY = 120;

export type WorkRequest = {
  id: string;
  contact_id: string | null;
  demo_id: string | null;
  company_name: string;
  kind: RequestKind;
  brief: string;
  status: RequestStatus;
  result_note: string | null;
  result_url: string | null;
  created_at: string;
  updated_at: string;
};

export type RequestInput = {
  kind: RequestKind;
  brief: string;
  companyName: string;
  contactId: string | null;
  demoId: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function optionalId(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "string" && UUID.test(value) ? value : undefined;
}

export function parseRequestInput(value: unknown): RequestInput | null {
  if (typeof value !== "object" || value === null) return null;
  const { kind, brief, companyName, contactId, demoId } = value as Record<string, unknown>;
  const validKind = REQUEST_KINDS.find((item) => item === kind);
  const text = typeof brief === "string" ? brief.trim() : "";
  const company = typeof companyName === "string" ? companyName.trim() : "";
  const contact = optionalId(contactId);
  const demo = optionalId(demoId);
  if (
    !validKind ||
    !text ||
    text.length > MAX_BRIEF ||
    !company ||
    company.length > MAX_REQUEST_COMPANY ||
    contact === undefined ||
    demo === undefined
  ) {
    return null;
  }
  return { kind: validKind, brief: text, companyName: company, contactId: contact, demoId: demo };
}

// Por fazer e em curso primeiro; dentro de cada estado, os mais recentes primeiro.
const ORDER: Record<RequestStatus, number> = { in_progress: 0, pending: 1, done: 2, cancelled: 3 };

export function sortRequests(requests: WorkRequest[]) {
  return [...requests].sort(
    (a, b) => ORDER[a.status] - ORDER[b.status] || b.created_at.localeCompare(a.created_at),
  );
}

// Só um endereço http(s) abre como ligação: o resultado vem do /pedidos, mas não se confia.
export function safeResultUrl(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}
