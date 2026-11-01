import type { SiteSignals, ThirdPartyKind } from "./types";

export const SLOW_SITE_MS = 4000;
export const OUTDATED_AFTER_YEARS = 4;

// Hospedeiros de terceiros: uma página aqui não é um site próprio, e nunca é visitada.
const THIRD_PARTY_HOSTS: Record<ThirdPartyKind, string[]> = {
  social: [
    "facebook.com", "fb.com", "fb.me", "m.me", "instagram.com", "tiktok.com",
    "twitter.com", "x.com", "linkedin.com", "youtube.com", "youtu.be",
    "pinterest.com", "pinterest.pt", "threads.net", "threads.com", "wa.me",
    "whatsapp.com", "t.me", "kwai.com",
  ],
  linkPage: [
    "linktr.ee", "beacons.ai", "lnk.bio", "bio.link", "taplink.cc", "linkin.bio",
    "campsite.bio", "solo.to", "milkshake.app", "linkbio.co",
  ],
  booking: [
    "booksy.com", "fresha.com", "treatwell.pt", "treatwell.com", "treatwell.es",
    "treatwell.co.uk", "thefork.pt", "thefork.com", "thefork.es", "opentable.com",
    "resy.com", "booking.com", "airbnb.com", "airbnb.pt", "airbnb.com.br",
    "doctoralia.pt", "doctoralia.com.br", "calendly.com", "setmore.com",
    "simplybook.me", "sheerme.com", "book.squareup.com",
  ],
  parked: [
    "sedo.com", "sedoparking.com", "dan.com", "afternic.com", "hugedomains.com",
    "undeveloped.com", "parkingcrew.net", "bodis.com",
  ],
};

export function thirdPartyKind(website: string): ThirdPartyKind | null {
  let host: string;
  try {
    host = new URL(website).hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return null;
  }

  for (const [kind, hosts] of Object.entries(THIRD_PARTY_HOSTS)) {
    if (hosts.some((item) => host === item || host.endsWith(`.${item}`))) {
      return kind as ThirdPartyKind;
    }
  }
  return null;
}

const PARKING_MARKERS =
  /sedoparking|parkingcrew|bodis\.com|parklogic|afternic\.com|hugedomains\.com|dan\.com\/buy-domain/i;
const FOR_SALE =
  /(this domain|the domain|domain name)[^.<]{0,40}(for sale|is parked)|buy this domain|(este|o) dom[ií]nio[^.<]{0,40}(à venda|a venda|estacionado)/i;
// Um site a sério pode falar de domínios à venda: só conta numa página quase vazia.
const PARKED_PAGE_MAX_TEXT = 3000;
const BLOCK_PAGE =
  /<title[^>]*>[^<]*(just a moment|attention required|access denied|acesso negado|captcha|are you human|checking your browser)/i;
const MIN_PAGE_TEXT = 200;

function visibleText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function copyrightYear(text: string) {
  const pattern =
    /(?:©|&copy;|&#169;|&#xa9;|copyright|\(c\))[^0-9<]{0,20}((?:19|20)\d{2})(?:\s*(?:-|–|—|a|to)\s*((?:19|20)\d{2}))?/gi;
  let latest: number | null = null;
  for (const match of text.matchAll(pattern)) {
    const year = Number(match[2] ?? match[1]);
    if (latest === null || year > latest) latest = year;
  }
  return latest;
}

function legacyTech(html: string) {
  if (/x-shockwave-flash|\.swf["'?\s>]/i.test(html)) return "flash";
  if (/<frameset[\s>]/i.test(html)) return "frameset";
  if (/<marquee[\s>]/i.test(html)) return "marquee";
  return null;
}

// O conteúdo é só dado: procura padrões em texto, nunca executa nem segue o que lá está.
// Devolve null quando a página não permite concluir nada, e aí não há pontos.
export function analyseHtml({
  html,
  responseMs,
  isHttps,
  now,
}: {
  html: string;
  responseMs: number;
  isHttps: boolean;
  now: Date;
}): SiteSignals | null {
  if (BLOCK_PAGE.test(html) || !/<(html|head|body|frameset)[\s>]/i.test(html)) {
    return null;
  }

  const clean = html.replace(/<!--[\s\S]*?-->/g, "");
  const markup = clean.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "");
  const text = visibleText(markup);

  if (
    text.length < PARKED_PAGE_MAX_TEXT &&
    (PARKING_MARKERS.test(clean) || FOR_SALE.test(text))
  ) {
    return {
      isSlow: null,
      isMobileFriendly: null,
      isOutdated: null,
      notOwn: "parked",
      observed: { noOwnWebsite: { kind: "thirdParty", thirdParty: "parked" } },
    };
  }

  const site: SiteSignals = {
    isSlow: responseMs > SLOW_SITE_MS,
    isMobileFriendly: null,
    isOutdated: false,
    observed: {},
  };
  const observed = site.observed!;

  if (site.isSlow) {
    observed.slowSite = { kind: "responseTime", ms: responseMs };
  }

  const hasViewport = /<meta\b[^>]*\bname\s*=\s*["']?viewport\b/i.test(markup);
  const tech = legacyTech(markup);
  // Uma página quase sem texto costuma ser montada por JavaScript: não dá para concluir.
  if (hasViewport) site.isMobileFriendly = true;
  else if (text.length >= MIN_PAGE_TEXT || tech === "frameset") {
    site.isMobileFriendly = false;
    observed.notMobileFriendly = { kind: "noViewport" };
  }

  const year = copyrightYear(markup);
  if (year !== null && year <= now.getFullYear()
    && now.getFullYear() - year >= OUTDATED_AFTER_YEARS) {
    observed.outdatedSite = { kind: "copyright", year };
  } else if (tech) {
    observed.outdatedSite = { kind: "legacyTech", tech };
  } else if (!isHttps) {
    observed.outdatedSite = { kind: "noHttps" };
  }
  site.isOutdated = observed.outdatedSite !== undefined;

  return site;
}

// robots.txt (RFC 9309): o grupo do nosso nome ganha ao "*", e a regra mais longa ganha.
export function robotsAllows(robots: string, agent: string, path: string) {
  type Group = { agents: string[]; rules: { allow: boolean; pattern: string }[] };
  const groups: Group[] = [];
  let current: Group | null = null;
  let readingAgents = false;

  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const field = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (field === "user-agent") {
      if (!readingAgents || !current) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      readingAgents = true;
    } else if ((field === "allow" || field === "disallow") && current) {
      readingAgents = false;
      if (value) current.rules.push({ allow: field === "allow", pattern: value });
    } else if (field) {
      readingAgents = false;
    }
  }

  const name = agent.toLowerCase();
  const own = groups.filter((group) => group.agents.includes(name));
  const applying = own.length
    ? own
    : groups.filter((group) => group.agents.includes("*"));

  let best: { allow: boolean; length: number } | null = null;
  for (const { allow, pattern } of applying.flatMap((group) => group.rules)) {
    const regex = new RegExp(
      `^${pattern
        .replace(/[.+?^{}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*")
        .replace(/\\?\$$/, "$")}`,
    );
    if (!regex.test(path)) continue;
    if (
      !best ||
      pattern.length > best.length ||
      (pattern.length === best.length && allow)
    ) {
      best = { allow, length: pattern.length };
    }
  }

  return best ? best.allow : true;
}
