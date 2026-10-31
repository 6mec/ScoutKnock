export const DELETE_CONFIRMATION = "APAGAR";

export function isDeleteConfirmed(value: unknown) {
  return value === DELETE_CONFIRMATION;
}

// Limites do docs/plano.md. Os preços ficam de fora até estarem decididos.
export const PLANS = [
  { id: "starter", searches: 100, demos: 10, recommended: false },
  { id: "pro", searches: 400, demos: 50, recommended: true },
  { id: "agency", searches: 1500, demos: 200, recommended: false },
] as const;
