// Propostas registadas na ficha do contacto: serviço, valor, sinal, validade e estado.
// Alimentam "Propostas abertas" e "Vendas do mês". O documento para imprimir é outro.
import { parseDealValue } from "@/lib/contacts/rules";

export const PROPOSAL_STATUSES = ["draft", "sent", "accepted", "refused"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];
export const MAX_PROPOSAL_SERVICE = 160;

export type Proposal = {
  id: string;
  contact_id: string;
  service: string;
  value: number | string;
  deposit: number | string | null;
  valid_until: string | null;
  status: ProposalStatus;
  sent_on: string | null;
  decided_on: string | null;
  created_at: string;
  updated_at: string;
};

export const PROPOSAL_COLUMNS =
  "id, contact_id, service, value, deposit, valid_until, status, sent_on, decided_on, created_at, updated_at";

export type ProposalInput = {
  service: string;
  value: number;
  deposit: number | null;
  validUntil: string | null;
  status: ProposalStatus;
};
export type ProposalError = "service" | "value" | "deposit" | "date" | "status";

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function isProposalStatus(value: unknown): value is ProposalStatus {
  return PROPOSAL_STATUSES.some((status) => status === value);
}

export function parseProposalInput(value: unknown): { ok: true; input: ProposalInput } | { ok: false; error: ProposalError } {
  if (!value || typeof value !== "object") return { ok: false, error: "service" };
  const raw = value as Record<string, unknown>;
  const service = typeof raw.service === "string" ? raw.service.trim() : "";
  if (!service || service.length > MAX_PROPOSAL_SERVICE) return { ok: false, error: "service" };
  const amount = parseDealValue(raw.value);
  if (amount === undefined || amount === null) return { ok: false, error: "value" };
  const deposit = parseDealValue(raw.deposit ?? null);
  if (deposit === undefined || (deposit !== null && deposit > amount)) return { ok: false, error: "deposit" };
  let validUntil: string | null = null;
  if (raw.validUntil !== undefined && raw.validUntil !== null && raw.validUntil !== "") {
    if (typeof raw.validUntil !== "string" || !isValidDate(raw.validUntil)) return { ok: false, error: "date" };
    validUntil = raw.validUntil;
  }
  if (!isProposalStatus(raw.status)) return { ok: false, error: "status" };
  return { ok: true, input: { service, value: amount, deposit: deposit || null, validUntil, status: raw.status } };
}

const toNumber = (value: number | string | null) => {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : 0;
};

// Abertas: enviadas e ainda sem resposta. Vendas do mês: aceites com decisão neste mês.
export function proposalNumbers(proposals: Pick<Proposal, "status" | "value" | "decided_on">[], today: string) {
  const month = today.slice(0, 7);
  let openCount = 0;
  let openValue = 0;
  let salesCount = 0;
  let salesValue = 0;
  for (const proposal of proposals) {
    if (proposal.status === "sent") {
      openCount += 1;
      openValue += toNumber(proposal.value);
    }
    if (proposal.status === "accepted" && proposal.decided_on?.startsWith(month)) {
      salesCount += 1;
      salesValue += toNumber(proposal.value);
    }
  }
  return { openCount, openValue, salesCount, salesValue };
}

// Expirada: enviada, com validade e o dia já passou (fica aberta, mas com aviso).
export function isExpired(proposal: Pick<Proposal, "status" | "valid_until">, today: string) {
  return proposal.status === "sent" && Boolean(proposal.valid_until) && (proposal.valid_until as string) < today;
}
