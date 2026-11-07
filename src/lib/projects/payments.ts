// Pagamentos recebidos por projeto, escritos pelo Daniel. Só servem para saber quanto falta
// receber da criação e quanto entrou por mês. Não são faturas nem contabilidade.
import { parseDealValue } from "@/lib/contacts/rules";
import { looksLikeSecret, type ClientProject } from "./rules";

export const PAYMENT_KINDS = ["build", "maintenance"] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];
export const MAX_PAYMENT_NOTE = 200;

export type ProjectPayment = {
  id: string;
  project_id: string;
  kind: PaymentKind;
  amount: number | string;
  paid_on: string;
  note: string | null;
  created_at: string;
};

export const PAYMENT_COLUMNS = "id, project_id, kind, amount, paid_on, note, created_at";

export type PaymentInput = { projectId: string; kind: PaymentKind; amount: number; paidOn: string; note: string | null };
export type PaymentError = "amount" | "date" | "future" | "secret" | "tooLong" | "required";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

// `today` em Lisboa (AAAA-MM-DD): um pagamento recebido não pode ter data futura.
export function parsePaymentInput(value: unknown, today: string): { ok: true; input: PaymentInput } | { ok: false; error: PaymentError } {
  if (!value || typeof value !== "object") return { ok: false, error: "required" };
  const raw = value as Record<string, unknown>;
  if (typeof raw.projectId !== "string" || !UUID.test(raw.projectId)) return { ok: false, error: "required" };
  if (!PAYMENT_KINDS.includes(raw.kind as PaymentKind)) return { ok: false, error: "required" };
  const amount = parseDealValue(raw.amount);
  if (amount === undefined || amount === null || amount <= 0) return { ok: false, error: "amount" };
  if (typeof raw.paidOn !== "string" || !isValidDate(raw.paidOn)) return { ok: false, error: "date" };
  if (raw.paidOn > today) return { ok: false, error: "future" };
  let note: string | null = null;
  if (raw.note !== undefined && raw.note !== null) {
    if (typeof raw.note !== "string") return { ok: false, error: "tooLong" };
    const text = raw.note.trim();
    if (text.length > MAX_PAYMENT_NOTE) return { ok: false, error: "tooLong" };
    note = text || null;
  }
  if (looksLikeSecret(note)) return { ok: false, error: "secret" };
  return { ok: true, input: { projectId: raw.projectId, kind: raw.kind as PaymentKind, amount, paidOn: raw.paidOn, note } };
}

const cents = (value: number | string | null | undefined) => {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? Math.round(number * 100) : 0;
};
const euros = (value: number) => value / 100;

// Criação combinada, já recebida e em falta de um projeto (nunca abaixo de zero).
export function projectBalance(project: Pick<ClientProject, "id" | "build_value">, payments: ProjectPayment[]) {
  const build = cents(project.build_value);
  const paid = payments
    .filter((payment) => payment.project_id === project.id && payment.kind === "build")
    .reduce((sum, payment) => sum + cents(payment.amount), 0);
  return { build: euros(build), paid: euros(paid), remaining: euros(Math.max(0, build - paid)) };
}

// "A receber": criação dos projetos aceites (tudo menos "pedido") menos os pagamentos da
// criação. Custos de terceiros e manutenção ficam de fora. Sem nenhum pagamento registado,
// `hasPayments` é falso e o Início diz isso em vez de mostrar um valor.
export function toReceive(
  projects: Pick<ClientProject, "id" | "status" | "build_value">[],
  payments: ProjectPayment[],
) {
  let total = 0;
  let count = 0;
  for (const project of projects) {
    if (project.status === "requested") continue;
    const remaining = projectBalance(project, payments).remaining;
    if (remaining > 0) {
      total += Math.round(remaining * 100);
      count += 1;
    }
  }
  return { amount: euros(total), count, hasPayments: payments.length > 0 };
}

// Mês (AAAA-MM) a `offset` meses de `month`.
function shiftMonth(month: string, offset: number) {
  const [year, number] = month.split("-").map(Number);
  const index = year * 12 + (number - 1) + offset;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

// O que entrou em cada um dos últimos `months` meses (o atual incluído), do mais antigo
// para o mais recente. Meses sem pagamentos ficam a zero.
export function receivedByMonth(payments: Pick<ProjectPayment, "amount" | "paid_on">[], today: string, months = 6) {
  const current = today.slice(0, 7);
  const list = Array.from({ length: months }, (_, index) => ({ month: shiftMonth(current, index - (months - 1)), total: 0 }));
  const byMonth = new Map(list.map((item) => [item.month, item]));
  const totals = new Map<string, number>();
  for (const payment of payments) {
    const month = payment.paid_on.slice(0, 7);
    if (byMonth.has(month)) totals.set(month, (totals.get(month) ?? 0) + cents(payment.amount));
  }
  return list.map((item) => ({ month: item.month, total: euros(totals.get(item.month) ?? 0) }));
}
