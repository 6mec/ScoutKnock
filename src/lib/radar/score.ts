import type {
  Company,
  Opportunity,
  ReasonCode,
  ScoreLevel,
  ServiceId,
} from "./types";

const FEW_REVIEWS_LIMIT = 20;

const WEBSITE_CREATION_POINTS: Record<ReasonCode, number> = {
  noWebsite: 70,
  slowSite: 25,
  notMobileFriendly: 25,
  outdatedSite: 20,
  fewReviews: 20,
  noOpeningHours: 10,
};

function websiteCreationReasons(company: Company): ReasonCode[] {
  const reasons: ReasonCode[] = [];

  if (company.website === null) {
    reasons.push("noWebsite");
  } else {
    if (company.site.isSlow === true) reasons.push("slowSite");
    if (company.site.isMobileFriendly === false) {
      reasons.push("notMobileFriendly");
    }
    if (company.site.isOutdated === true) reasons.push("outdatedSite");
  }

  if (company.reviewCount < FEW_REVIEWS_LIMIT) reasons.push("fewReviews");
  if (!company.hasOpeningHours) reasons.push("noOpeningHours");

  return reasons;
}

// Cada serviço tem os seus motivos e pontos. Um serviço novo acrescenta-se aqui.
const SCORING: Record<
  ServiceId,
  {
    points: Record<ReasonCode, number>;
    reasons: (company: Company) => ReasonCode[];
  }
> = {
  website_creation: {
    points: WEBSITE_CREATION_POINTS,
    reasons: websiteCreationReasons,
  },
};

export function scoreLevel(score: number): ScoreLevel {
  if (score >= 70) return "strong";
  if (score >= 40) return "medium";
  return "weak";
}

export function scoreCompany(
  company: Company,
  service: ServiceId,
): Opportunity {
  const { points, reasons: findReasons } = SCORING[service];
  const reasons = findReasons(company).map((code) => ({
    code,
    points: points[code],
  }));
  const score = reasons.reduce((total, reason) => total + reason.points, 0);

  return { score, level: scoreLevel(score), reasons };
}
