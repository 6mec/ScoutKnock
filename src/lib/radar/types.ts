export type ServiceId = "website_creation" | "online_booking";

export const SERVICE_IDS: ServiceId[] = ["website_creation", "online_booking"];

// Só dados públicos e comerciais. `website` a null significa que não tem site.
// Nos sinais do site, null significa que ainda não foi verificado e não dá pontos.
export type ThirdPartyKind = "social" | "linkPage" | "booking" | "parked";

// O que foi mesmo observado, para o motivo o poder mostrar.
export type SiteObservation =
  | { kind: "responseTime"; ms: number }
  | { kind: "noViewport" }
  | { kind: "copyright"; year: number }
  | { kind: "legacyTech"; tech: "flash" | "frameset" | "marquee" }
  | { kind: "noHttps" }
  | { kind: "thirdParty"; thirdParty: ThirdPartyKind };

export type SiteSignals = {
  isSlow: boolean | null;
  isMobileFriendly: boolean | null;
  isOutdated: boolean | null;
  // Só a verificação preenche estes dois: redirecionamentos e domínios estacionados.
  notOwn?: ThirdPartyKind | null;
  observed?: Partial<Record<ReasonCode, SiteObservation>>;
};

export type Company = {
  id: string;
  name: string;
  niche: string;
  locality: string;
  address: string;
  phone?: string | null;
  website: string | null;
  reviewCount: number;
  hasOpeningHours: boolean;
  site: SiteSignals;
  // Só nas empresas de exemplo. As do Google não trazem coordenadas: os termos do
  // Google não deixam mostrá-las num mapa que não seja do Google.
  location?: [number, number];
};

export type ReasonCode =
  | "noWebsite"
  | "noOwnWebsite"
  | "slowSite"
  | "notMobileFriendly"
  | "outdatedSite"
  | "fewReviews"
  | "noOpeningHours"
  // Só nas marcações: o "site" é uma página de marcações de outra empresa.
  | "bookingPlatform";

export type ScoreLevel = "strong" | "medium" | "weak";

export type Opportunity = {
  score: number;
  level: ScoreLevel;
  reasons: { code: ReasonCode; points: number; observed?: SiteObservation }[];
};

export type SearchQuery = {
  service: ServiceId;
  niche: string;
  locality: string;
};
