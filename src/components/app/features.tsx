"use client";

import { createContext, useContext, type ReactNode } from "react";

// O que está em pausa fica no código, mas fora da interface. O painel decide no servidor
// (SIGNUPS_ENABLED, GOOGLE_PLACES_API_KEY) e os componentes só leem daqui.
export type Features = {
  // Planos, packs e Stripe: só com os registos abertos.
  plans: boolean;
  // O número de avaliações escrito à mão só faz sentido com o Google Places ligado.
  googleReviews: boolean;
};

// Sem fornecedor (testes, páginas fora do painel), tudo o que está em pausa fica escondido.
const FeaturesContext = createContext<Features>({ plans: false, googleReviews: false });

export function FeaturesProvider({ value, children }: { value: Features; children: ReactNode }) {
  return <FeaturesContext.Provider value={value}>{children}</FeaturesContext.Provider>;
}

export function useFeatures() {
  return useContext(FeaturesContext);
}
