import { thirdPartyKind } from "./site-rules";
import type {
  Company,
  Opportunity,
  ReasonCode,
  ScoreLevel,
  ServiceId,
  SiteObservation,
  ThirdPartyKind,
} from "./types";

const FEW_REVIEWS_LIMIT = 20;

const WEBSITE_CREATION_POINTS: Record<ReasonCode, number> = {
  noWebsite: 70,
  noOwnWebsite: 70,
  slowSite: 25,
  notMobileFriendly: 25,
  outdatedSite: 20,
  fewReviews: 20,
  noOpeningHours: 10,
  // Nos sites conta como "sem site próprio": este motivo não aparece.
  bookingPlatform: 70,
};

// Marcações: pesa quem só marca por telefone ou depende de outra plataforma. Sem site
// não há onde marcar; num site próprio, conta sobretudo a versão para telemóvel.
const ONLINE_BOOKING_POINTS: Record<ReasonCode, number> = {
  noWebsite: 50,
  bookingPlatform: 50,
  noOwnWebsite: 40,
  notMobileFriendly: 20,
  slowSite: 10,
  outdatedSite: 10,
  noOpeningHours: 20,
  fewReviews: 10,
};

function notOwnKind(company: Company): ThirdPartyKind | null {
  if (company.website === null) return null;
  return thirdPartyKind(company.website) ?? company.site.notOwn ?? null;
}

function websiteCreationReasons(company: Company): ReasonCode[] {
  const reasons: ReasonCode[] = [];

  if (company.website === null) {
    reasons.push("noWebsite");
  } else if (notOwnKind(company)) {
    reasons.push("noOwnWebsite");
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

function onlineBookingReasons(company: Company): ReasonCode[] {
  const reasons: ReasonCode[] = [];
  const kind = notOwnKind(company);

  if (company.website === null) {
    reasons.push("noWebsite");
  } else if (kind === "booking") {
    reasons.push("bookingPlatform");
  } else if (kind) {
    reasons.push("noOwnWebsite");
  } else {
    if (company.site.isMobileFriendly === false) reasons.push("notMobileFriendly");
    if (company.site.isSlow === true) reasons.push("slowSite");
    if (company.site.isOutdated === true) reasons.push("outdatedSite");
  }

  if (!company.hasOpeningHours) reasons.push("noOpeningHours");
  if (company.reviewCount < FEW_REVIEWS_LIMIT) reasons.push("fewReviews");

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
  online_booking: {
    points: ONLINE_BOOKING_POINTS,
    reasons: onlineBookingReasons,
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
  const kind = notOwnKind(company);
  const reasons = findReasons(company).map((code) => {
    const observed: SiteObservation | undefined =
      (code === "noOwnWebsite" || code === "bookingPlatform") && kind
        ? { kind: "thirdParty", thirdParty: kind }
        : company.site.observed?.[code];

    return { code, points: points[code], ...(observed ? { observed } : {}) };
  });
  const score = reasons.reduce((total, reason) => total + reason.points, 0);

  return { score, level: scoreLevel(score), reasons };
}
