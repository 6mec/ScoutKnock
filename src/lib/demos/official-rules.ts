export const OFFICIAL_SITE_PRICE_EUR = 5;
export const OFFICIAL_SITE_METADATA_KIND = "official_site";
export const MIN_SITE_NAME = 3;
export const MAX_SITE_NAME = 40;

// Têm de bater certo com reserve_official_site na base de dados.
const RESERVED_NAMES = [
  "www", "api", "app", "admin", "mail", "email", "painel", "suporte", "support",
  "scoutknock", "status", "blog", "ajuda", "help", "static", "assets", "bot",
];

export type OfficialStatus = "pending" | "active" | "past_due" | "ended";

export type OfficialSite = {
  name: string;
  status: OfficialStatus;
  cancel_at_period_end: boolean;
  period_end: string | null;
  name_reserved_until: string | null;
};

// Enquanto o Stripe tenta cobrar, o site continua no ar: decisão do Daniel.
export function isLive(site?: Pick<OfficialSite, "status"> | null) {
  return site?.status === "active" || site?.status === "past_due";
}

export function parseSiteName(value: unknown) {
  if (typeof value !== "string") return null;

  const name = value.trim();
  return /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(name) && !RESERVED_NAMES.includes(name)
    ? name
    : null;
}

export function suggestSiteName(companyName: string) {
  return companyName
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, MAX_SITE_NAME)
    .replace(/^-+|-+$/g, "");
}

export function parseRemovalContact(value: string | undefined) {
  const email = value?.trim();
  return email && /^[^\s@<>"]+@[^\s@<>"]+$/.test(email) ? email : null;
}

// Sem OFFICIAL_SITES_BASE_DOMAIN, os sites ficam em /s/nome.
export function officialSiteUrl(
  name: string,
  { siteUrl, baseDomain }: { siteUrl: string; baseDomain?: string },
) {
  return baseDomain
    ? `https://${name}.${baseDomain}/`
    : new URL(`/s/${name}`, siteUrl).toString();
}

// O modelo de subdomínio: nome.dominio passa a servir /s/nome. Desligado sem domínio.
export function subdomainRewritePath(
  host: string | null,
  pathname: string,
  baseDomain?: string,
) {
  if (!baseDomain || !host || pathname !== "/") return null;

  const hostname = host.split(":")[0].toLowerCase();
  if (!hostname.endsWith(`.${baseDomain}`)) return null;

  const name = parseSiteName(hostname.slice(0, -baseDomain.length - 1));
  return name ? `/s/${name}` : null;
}
