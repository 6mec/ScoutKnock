import { parseDealValue } from "./rules";

export const MAX_PROPOSAL_ITEMS = 10;
export const DEFAULT_VALIDITY_DAYS = 15;
const DAY_MS = 86_400_000;

export type ProposalItem = { description: string; price: string };

export type ProposalForm = {
  yourName: string;
  yourContact: string;
  clientName: string;
  items: ProposalItem[];
  monthlyValue: string;
  monthlyDescription: string;
  delivery: string;
  validityDays: string;
  notes: string;
};

// Só entram as linhas com descrição e valor válido. Valores inválidos ficam
// assinalados para o formulário avisar.
export function proposalLines(items: ProposalItem[]) {
  const lines: { description: string; price: number }[] = [];
  const invalid = new Set<number>();
  items.forEach((item, index) => {
    const price = parseDealValue(item.price);
    if (price === undefined) {
      invalid.add(index);
      return;
    }
    if (item.description.trim() && price !== null) {
      lines.push({ description: item.description.trim(), price });
    }
  });
  const total = Math.round(lines.reduce((sum, line) => sum + line.price, 0) * 100) / 100;
  return { lines, total, invalid };
}

export function validityDays(value: string) {
  const days = Number(value);
  return Number.isInteger(days) && days >= 1 && days <= 365 ? days : DEFAULT_VALIDITY_DAYS;
}

export function validUntil(now: number, days: number) {
  return new Date(now + days * DAY_MS);
}
