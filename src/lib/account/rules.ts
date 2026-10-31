export const DELETE_CONFIRMATION = "APAGAR";

export function isDeleteConfirmed(value: unknown) {
  return value === DELETE_CONFIRMATION;
}

// Limites provisórios do docs/plano.md, que cumprem os 30% no pior caso, e preços (proposta inicial). O valor cobrado é o do
// preço criado no Stripe: estes só se mostram com os pagamentos ligados.
// Os limites têm de bater certo com public.plan_limits e public.plan_lookup_limits.
export const PLANS = [
  { id: "starter", searches: 100, demos: 10, lookups: 3, monthlyLookups: 90, recommended: false, price: { eur: 19, brl: 49 } },
  { id: "pro", searches: 150, demos: 50, lookups: 10, monthlyLookups: 300, recommended: true, price: { eur: 39, brl: 97 } },
  { id: "agency", searches: 245, demos: 200, lookups: 25, monthlyLookups: 750, recommended: false, price: { eur: 79, brl: 197 } },
] as const;
