import { normalizeWebsite } from "@/lib/contacts/manual";
import { parseSiteName, suggestSiteName } from "@/lib/demos/official-rules";
import { whatsappNumber } from "@/lib/messages/rules";

// Têm de bater certo com as verificações da tabela portfolios.
export const MAX_SERVICES = 6;
export const MAX_PROJECTS = 8;
export const LIMITS = {
  displayName: 80,
  headline: 120,
  about: 1200,
  city: 80,
  whatsapp: 40,
  email: 200,
  itemTitle: 80,
  itemDescription: 240,
  url: 300,
} as const;

export type PortfolioService = { title: string; description: string | null };
export type PortfolioProject = { title: string; description: string | null; url: string | null };

export type PortfolioInput = {
  slug: string;
  published: boolean;
  displayName: string;
  headline: string | null;
  about: string | null;
  city: string | null;
  whatsapp: string | null;
  email: string | null;
  services: PortfolioService[];
  projects: PortfolioProject[];
  showSites: boolean;
};

// O que a página pública recebe da base de dados.
export type PublicPortfolio = {
  slug: string;
  display_name: string;
  headline: string | null;
  about: string | null;
  city: string | null;
  whatsapp: string | null;
  email: string | null;
  services: PortfolioService[];
  projects: PortfolioProject[];
  sites: { name: string; company_name: string }[];
};

export type PortfolioError =
  | "slug"
  | "displayName"
  | "whatsapp"
  | "email"
  | "url"
  | "tooLong";

function text(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  if (clean.length > max) return undefined;
  return clean || null;
}

export function suggestSlug(name: string) {
  const slug = suggestSiteName(name);
  return parseSiteName(slug) ? slug : "";
}

// Valida tudo o que vem do formulário; as linhas sem título ficam de fora.
export function parsePortfolio(
  value: unknown,
): { ok: true; portfolio: PortfolioInput } | { ok: false; error: PortfolioError } {
  if (typeof value !== "object" || value === null) return { ok: false, error: "tooLong" };
  const raw = value as Record<string, unknown>;

  const slug = parseSiteName(typeof raw.slug === "string" ? raw.slug.toLowerCase() : raw.slug);
  if (!slug) return { ok: false, error: "slug" };

  const displayName = text(raw.displayName, LIMITS.displayName);
  if (!displayName) return { ok: false, error: "displayName" };

  const headline = text(raw.headline, LIMITS.headline);
  const about = text(raw.about, LIMITS.about);
  const city = text(raw.city, LIMITS.city);
  if (headline === undefined || about === undefined || city === undefined) {
    return { ok: false, error: "tooLong" };
  }

  const whatsapp = text(raw.whatsapp, LIMITS.whatsapp);
  if (whatsapp === undefined || (whatsapp && !whatsappNumber(whatsapp))) {
    return { ok: false, error: "whatsapp" };
  }

  const email = text(raw.email, LIMITS.email);
  if (email === undefined || (email && !/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email))) {
    return { ok: false, error: "email" };
  }

  const services: PortfolioService[] = [];
  for (const item of Array.isArray(raw.services) ? raw.services.slice(0, MAX_SERVICES) : []) {
    const title = text(item?.title, LIMITS.itemTitle);
    const description = text(item?.description, LIMITS.itemDescription);
    if (title === undefined || description === undefined) return { ok: false, error: "tooLong" };
    if (title) services.push({ title, description });
  }

  const projects: PortfolioProject[] = [];
  for (const item of Array.isArray(raw.projects) ? raw.projects.slice(0, MAX_PROJECTS) : []) {
    const title = text(item?.title, LIMITS.itemTitle);
    const description = text(item?.description, LIMITS.itemDescription);
    const link = text(item?.url, LIMITS.url);
    if (title === undefined || description === undefined || link === undefined) {
      return { ok: false, error: "tooLong" };
    }
    const url = link ? normalizeWebsite(link) : null;
    if (url === undefined) return { ok: false, error: "url" };
    if (title) projects.push({ title, description, url });
  }

  return {
    ok: true,
    portfolio: {
      slug,
      published: raw.published === true,
      displayName,
      headline,
      about,
      city,
      whatsapp,
      email,
      services,
      projects,
      showSites: raw.showSites !== false,
    },
  };
}

export function portfolioUrl(slug: string, siteUrl: string) {
  return new URL(`/p/${slug}`, siteUrl).toString();
}
