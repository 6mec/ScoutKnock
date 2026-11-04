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

// Preço por ano, em euros, de cada pack. Decisão do Daniel: enquanto estiver a null,
// o separador "Anual" não aparece. Os limites continuam a ser por mês, e o teste do
// custo no pior caso obriga a que o preço anual a dividir por 12 cumpra os 30%.
export const YEARLY_PRICES_EUR: Record<(typeof PLANS)[number]["id"], number | null> = {
  starter: null,
  pro: null,
  agency: null,
};

// Limites de quem tem o papel de admin (public.user_roles). Têm de bater certo com
// public.plan_limits e public.plan_lookup_limits. Os tetos do projeto continuam a valer.
export const ADMIN_LIMITS = { searches: 10000, demos: 10000, lookups: 1000, monthlyLookups: 10000 };
