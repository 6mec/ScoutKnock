import { normalizeWebsite } from "@/lib/contacts/manual";
import { parseSiteName, suggestSiteName } from "@/lib/demos/official-rules";
import { whatsappNumber } from "@/lib/messages/rules";
import { looksLikeSecret } from "@/lib/projects/rules";

// Têm de bater certo com as verificações das tabelas portfolios, client_projects e
// portfolio_testimonials.
export const MAX_SERVICES = 6;
export const MAX_STEPS = 4;
export const MAX_WORKS = 8;
export const LIMITS = {
  displayName: 80,
  headline: 120,
  about: 1200,
  city: 80,
  whatsapp: 40,
  email: 200,
  itemTitle: 80,
  serviceLine: 160,
  stepTitle: 40,
  stepText: 160,
  priceFrom: 60,
  url: 300,
  summary: 240,
  firstName: 40,
  company: 80,
  quote: 400,
} as const;

export type PortfolioService = { title: string; description: string | null };
export type PortfolioStep = { title: string; text: string };
// Lista antiga escrita à mão: fica na base de dados, já não sai na página.
export type PortfolioProject = { title: string; description: string | null; url: string | null };

export type PortfolioInput = {
  slug: string;
  published: boolean;
  indexable: boolean;
  displayName: string;
  headline: string | null;
  about: string | null;
  city: string | null;
  whatsapp: string | null;
  email: string | null;
  services: PortfolioService[];
  processSteps: PortfolioStep[];
  priceFrom: string | null;
};

export type PortfolioWork = {
  id: string;
  company_name: string;
  kind: "site" | "site_booking" | "app" | "other";
  summary: string | null;
  url: string | null;
  image: string | null;
};

export type PortfolioTestimonial = { first_name: string; company: string; quote: string };

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
  process_steps?: PortfolioStep[];
  price_from?: string | null;
  indexable?: boolean;
  works?: PortfolioWork[];
  testimonials?: PortfolioTestimonial[];
  // Vêm sempre vazios desde a T12; ficam para a pré-visualização antiga não partir.
  projects: PortfolioProject[];
  sites: { name: string; company_name: string }[];
};

export type PortfolioError =
  | "slug"
  | "displayName"
  | "whatsapp"
  | "email"
  | "url"
  | "serviceLine"
  | "step"
  | "secret"
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

// Distância de edição (letras trocadas, a mais ou a menos).
function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

export type SlugWarning = "changed" | "doubleHyphen" | "format" | "reserved" | "typo";

// Verificação ao escrever o endereço: o que fica de facto, o que mudou e um possível erro
// de escrita (quase igual ao nome, com 1 ou 2 letras de diferença).
export function checkSlug(value: string, displayName: string) {
  const normalized = suggestSiteName(value);
  const warnings: SlugWarning[] = [];
  if (normalized !== value.trim()) warnings.push("changed");
  if (/--/.test(value)) warnings.push("doubleHyphen");
  const valid = parseSiteName(normalized) !== null;
  if (!valid) warnings.push(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(normalized) ? "reserved" : "format");
  const fromName = suggestSlug(displayName);
  let suggestion: string | null = null;
  if (valid && fromName && fromName !== normalized) {
    const gap = distance(normalized, fromName);
    if (gap > 0 && gap <= 2 && Math.abs(normalized.length - fromName.length) <= 2) {
      suggestion = fromName;
      warnings.push("typo");
    }
  }
  return { slug: normalized, valid, warnings, suggestion };
}

// Valida tudo o que vem do formulário; as linhas sem título ficam de fora.
export function parsePortfolio(
  value: unknown,
): { ok: true; portfolio: PortfolioInput } | { ok: false; error: PortfolioError } {
  if (typeof value !== "object" || value === null) return { ok: false, error: "tooLong" };
  const raw = value as Record<string, unknown>;

  const slug = parseSiteName(typeof raw.slug === "string" ? raw.slug.trim().toLowerCase() : raw.slug);
  if (!slug) return { ok: false, error: "slug" };

  const displayName = text(raw.displayName, LIMITS.displayName);
  if (!displayName) return { ok: false, error: "displayName" };

  const headline = text(raw.headline, LIMITS.headline);
  const about = text(raw.about, LIMITS.about);
  const city = text(raw.city, LIMITS.city);
  const priceFrom = text(raw.priceFrom, LIMITS.priceFrom);
  if (headline === undefined || about === undefined || city === undefined || priceFrom === undefined) {
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

  // Cada serviço leva uma linha a dizer o que é.
  const services: PortfolioService[] = [];
  for (const item of Array.isArray(raw.services) ? raw.services.slice(0, MAX_SERVICES) : []) {
    const title = text(item?.title, LIMITS.itemTitle);
    const description = text(item?.description, LIMITS.serviceLine);
    if (title === undefined || description === undefined) return { ok: false, error: "tooLong" };
    if (!title) continue;
    if (!description) return { ok: false, error: "serviceLine" };
    services.push({ title, description });
  }

  // Os 4 passos: sem nenhum preenchido, a página usa os textos de base.
  const processSteps: PortfolioStep[] = [];
  for (const item of Array.isArray(raw.processSteps) ? raw.processSteps.slice(0, MAX_STEPS) : []) {
    const title = text(item?.title, LIMITS.stepTitle);
    const stepText = text(item?.text, LIMITS.stepText);
    if (title === undefined || stepText === undefined) return { ok: false, error: "tooLong" };
    if (!title && !stepText) continue;
    if (!title || !stepText) return { ok: false, error: "step" };
    processSteps.push({ title, text: stepText });
  }

  if ([headline, about, city, priceFrom, ...services.map((s) => s.description), ...processSteps.map((s) => s.text)].some((t) => looksLikeSecret(t ?? null))) {
    return { ok: false, error: "secret" };
  }

  return {
    ok: true,
    portfolio: {
      slug,
      published: raw.published === true,
      indexable: raw.indexable === true,
      displayName,
      headline,
      about,
      city,
      whatsapp,
      email,
      services,
      processSteps,
      priceFrom,
    },
  };
}

export type WorkInput = { show: boolean; summary: string | null; url: string | null };
export type WorkError = "status" | "summary" | "url" | "tooLong" | "secret";
const SHOWABLE = ["delivered", "maintenance", "finished"];

// O que o projeto mostra no portfólio. Só se mostra o que já foi entregue.
export function parseWork(value: unknown, status: string): { ok: true; work: WorkInput } | { ok: false; error: WorkError } {
  if (typeof value !== "object" || value === null) return { ok: false, error: "tooLong" };
  const raw = value as Record<string, unknown>;
  const show = raw.show === true;
  if (show && !SHOWABLE.includes(status)) return { ok: false, error: "status" };
  const summary = text(raw.summary, LIMITS.summary);
  const link = text(raw.url, LIMITS.url);
  if (summary === undefined || link === undefined) return { ok: false, error: "tooLong" };
  const url = link ? normalizeWebsite(link) : null;
  if (url === undefined) return { ok: false, error: "url" };
  if (show && !summary) return { ok: false, error: "summary" };
  if (looksLikeSecret(summary) || looksLikeSecret(url)) return { ok: false, error: "secret" };
  return { ok: true, work: { show, summary, url } };
}

export function canShowWork(status: string) {
  return SHOWABLE.includes(status);
}

export type TestimonialInput = { firstName: string; company: string; quote: string; authorized: boolean; projectId: string | null };
export type TestimonialError = "firstName" | "company" | "quote" | "tooLong";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Uma opinião real: só o primeiro nome (o resto do nome é cortado) e a empresa.
export function parseTestimonial(value: unknown): { ok: true; testimonial: TestimonialInput } | { ok: false; error: TestimonialError } {
  if (typeof value !== "object" || value === null) return { ok: false, error: "tooLong" };
  const raw = value as Record<string, unknown>;
  const name = text(raw.firstName, 200);
  const company = text(raw.company, LIMITS.company);
  const quote = text(raw.quote, LIMITS.quote);
  if (name === undefined || company === undefined || quote === undefined) return { ok: false, error: "tooLong" };
  const firstName = name?.split(/\s+/)[0].slice(0, LIMITS.firstName) ?? null;
  if (!firstName) return { ok: false, error: "firstName" };
  if (!company) return { ok: false, error: "company" };
  if (!quote) return { ok: false, error: "quote" };
  const projectId = typeof raw.projectId === "string" && UUID.test(raw.projectId) ? raw.projectId : null;
  return { ok: true, testimonial: { firstName, company, quote, authorized: raw.authorized === true, projectId } };
}

export function portfolioUrl(slug: string, siteUrl: string) {
  return new URL(`/p/${slug}`, siteUrl).toString();
}
