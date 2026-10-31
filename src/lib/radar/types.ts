export type ServiceId = "website_creation";

export const SERVICE_IDS: ServiceId[] = ["website_creation"];

// Só dados públicos e comerciais. `website` a null significa que não tem site.
// Nos sinais do site, null significa que ainda não foi verificado e não dá pontos.
export type Company = {
  id: string;
  name: string;
  niche: string;
  locality: string;
  address: string;
  website: string | null;
  reviewCount: number;
  hasOpeningHours: boolean;
  site: {
    isSlow: boolean | null;
    isMobileFriendly: boolean | null;
    isOutdated: boolean | null;
  };
};

export type ReasonCode =
  | "noWebsite"
  | "slowSite"
  | "notMobileFriendly"
  | "outdatedSite"
  | "fewReviews"
  | "noOpeningHours";

export type ScoreLevel = "strong" | "medium" | "weak";

export type Opportunity = {
  score: number;
  level: ScoreLevel;
  reasons: { code: ReasonCode; points: number }[];
};

export type SearchQuery = {
  service: ServiceId;
  niche: string;
  locality: string;
};
