export const DELETE_CONFIRMATION = "APAGAR";

export function isDeleteConfirmed(value: unknown) {
  return value === DELETE_CONFIRMATION;
}

// Limites e preços do docs/plano.md (proposta inicial). O valor cobrado é o do
// preço criado no Stripe: estes só se mostram com os pagamentos ligados.
// Os limites têm de bater certo com public.plan_limits.
export const PLANS = [
  { id: "starter", searches: 100, demos: 10, recommended: false, price: { eur: 19, brl: 49 } },
  { id: "pro", searches: 400, demos: 50, recommended: true, price: { eur: 39, brl: 97 } },
  { id: "agency", searches: 1500, demos: 200, recommended: false, price: { eur: 79, brl: 197 } },
] as const;
