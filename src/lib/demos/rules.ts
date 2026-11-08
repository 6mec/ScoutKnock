import { IDENTITY_ACCENTS, isIdentityKey, matchIdentity, type IdentityKey } from "./identities";
import { MAX_BOOKING_HOURS } from "./booking";
import type { OfficialSite } from "./official-rules";

export const DEMO_TEMPLATES = ["classic", "bold", "soft"] as const;
export type DemoTemplate = (typeof DEMO_TEMPLATES)[number];

// Todas têm contraste de pelo menos 4.5:1 com branco, nos dois sentidos.
export const DEMO_COLORS = {
  teal: "#0F766E",
  blue: "#1D4ED8",
  red: "#B91C1C",
  violet: "#6D28D9",
  terracotta: "#9A3412",
} as const;
export type DemoColorName = keyof typeof DEMO_COLORS;

const BASE_COLORS: string[] = Object.values(DEMO_COLORS);
// Também as cores de destaque das identidades de cada nicho.
const COLOR_VALUES: string[] = [...new Set([...BASE_COLORS, ...IDENTITY_ACCENTS])];

export function isDemoColor(value: unknown): value is string {
  return typeof value === "string" && COLOR_VALUES.includes(value);
}
const SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_LENGTH = 12;

export const MAX_COMPANY_NAME = 120;
export const MAX_HEADLINE = 120;
export const MAX_INTRO = 400;
export const MAX_AUTHOR_NAME = 80;
export const MAX_NICHE = 80;
export const MAX_LOCALITY = 80;
export const MAX_ADDRESS = 200;
export const MAX_PHONE = 40;
export const MAX_SUBHEADLINE = 200;
export const MAX_CTA = 40;
export const MAX_ABOUT = 800;
export const MAX_ITEM_TITLE = 60;
export const MAX_ITEM_DESCRIPTION = 160;
export const MAX_SERVICES = 6;
export const MAX_HIGHLIGHTS = 3;

export type DemoItem = { title: string; description: string };

// O que o freelancer escreve no formulário. Nada disto vem do Google.
export type DemoDraft = {
  companyName: string;
  niche: string;
  locality: string;
  address: string;
  phone: string | null;
};

export type DemoContent = DemoDraft & {
  template: DemoTemplate;
  accentColor: string;
  headline: string;
  intro: string;
  nicheStyle: IdentityKey;
  subheadline: string;
  ctaLabel: string;
  about: string;
  services: DemoItem[];
  highlights: DemoItem[];
  bookingEnabled: boolean;
  bookingHours: string;
};

export type PublicDemo = {
  company_name: string;
  niche: string;
  locality: string;
  address: string;
  phone: string | null;
  template: DemoTemplate;
  accent_color: string;
  headline: string;
  intro: string;
  author_name: string;
  // Vazios nas demos feitas antes do construtor: a página usa o modelo do nicho.
  niche_style?: string | null;
  subheadline?: string | null;
  cta_label?: string | null;
  about?: string | null;
  services?: DemoItem[] | null;
  highlights?: DemoItem[] | null;
  // Pedidos de marcação por WhatsApp, com o horário escrito pelo freelancer.
  booking_enabled?: boolean | null;
  booking_hours?: string | null;
};

export type OwnDemo = PublicDemo & {
  id: string;
  // Pode ir no {link_demo} de empresas do mesmo nicho sem demo própria.
  niche_example?: boolean;
  slug: string;
  status: "draft" | "sent";
  // Vazio num site oficial, que não tem data de apagamento.
  expires_at: string | null;
  created_at: string;
  official_sites?: OfficialSite | null;
  // Escritas com o Claude já usadas nesta demo (no máximo 3).
  ai_generations?: number;
};

// Inclui os sites oficiais, que não têm data de validade.
export function activeDemoFilter(now = new Date()) {
  return `expires_at.gt.${now.toISOString()},expires_at.is.null`;
}

export const OWN_DEMO_COLUMNS =
  "*, official_sites(name, status, cancel_at_period_end, period_end, name_reserved_until, published_directly)";

// Cerca de 62 bits aleatórios: o endereço não se adivinha e a demo não se lista.
// Rejeita os bytes acima do último múltiplo, para nenhuma letra sair mais vezes.
export function createDemoSlug() {
  const limit = 256 - (256 % SLUG_ALPHABET.length);
  let slug = "";

  while (slug.length < SLUG_LENGTH) {
    for (const byte of crypto.getRandomValues(new Uint8Array(SLUG_LENGTH))) {
      if (byte < limit && slug.length < SLUG_LENGTH) {
        slug += SLUG_ALPHABET[byte % SLUG_ALPHABET.length];
      }
    }
  }

  return slug;
}

// A mesma empresa do mesmo nicho começa sempre com a mesma cor.
export function colorForNiche(niche: string) {
  const sum = Array.from(niche).reduce((total, char) => total + char.charCodeAt(0), 0);
  return BASE_COLORS[sum % BASE_COLORS.length];
}

function shortText(value: unknown, max: number): string | undefined {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  return text.length <= max ? text : undefined;
}

// Linhas de serviços ou destaques: as sem título ficam de fora.
export function parseDemoItems(value: unknown, max: number): DemoItem[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return null;
  const items: DemoItem[] = [];
  for (const item of value.slice(0, max)) {
    if (typeof item !== "object" || item === null) return null;
    const title = shortText((item as DemoItem).title, MAX_ITEM_TITLE);
    const description = shortText((item as DemoItem).description, MAX_ITEM_DESCRIPTION);
    if (title === undefined || description === undefined) return null;
    if (title) items.push({ title, description });
  }
  return items;
}

export function parseAuthorName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name && name.length <= MAX_AUTHOR_NAME ? name : null;
}

export function parseDemoDraft(value: unknown): DemoDraft | null {
  if (typeof value !== "object" || value === null) return null;

  const { companyName, niche, locality, address, phone } = value as Record<
    string,
    unknown
  >;

  if (
    typeof companyName !== "string" ||
    typeof niche !== "string" ||
    typeof locality !== "string" ||
    typeof address !== "string" ||
    (typeof phone !== "string" && phone !== null && phone !== undefined)
  ) {
    return null;
  }

  const draft = {
    companyName: companyName.trim(),
    niche: niche.trim(),
    locality: locality.trim(),
    address: address.trim(),
    phone: phone?.trim() || null,
  };

  if (
    !draft.companyName ||
    !draft.niche ||
    !draft.locality ||
    !draft.address ||
    draft.companyName.length > MAX_COMPANY_NAME ||
    draft.niche.length > MAX_NICHE ||
    draft.locality.length > MAX_LOCALITY ||
    draft.address.length > MAX_ADDRESS ||
    (draft.phone?.length ?? 0) > MAX_PHONE
  ) {
    return null;
  }

  return draft;
}

export function parseDemoContent(value: unknown): DemoContent | null {
  const draft = parseDemoDraft(value);
  if (!draft) return null;

  const { template, accentColor, headline, intro, nicheStyle, subheadline, ctaLabel, about, services, highlights, bookingEnabled, bookingHours } =
    value as Record<string, unknown>;
  const extras = {
    subheadline: shortText(subheadline, MAX_SUBHEADLINE),
    ctaLabel: shortText(ctaLabel, MAX_CTA),
    about: shortText(about, MAX_ABOUT),
    bookingHours: shortText(bookingHours, MAX_BOOKING_HOURS),
  };
  if (bookingEnabled !== undefined && typeof bookingEnabled !== "boolean") return null;
  const serviceItems = parseDemoItems(services, MAX_SERVICES);
  const highlightItems = parseDemoItems(highlights, MAX_HIGHLIGHTS);
  if (
    extras.subheadline === undefined ||
    extras.ctaLabel === undefined ||
    extras.about === undefined ||
    extras.bookingHours === undefined ||
    !serviceItems ||
    !highlightItems
  ) {
    return null;
  }

  if (
    typeof headline !== "string" ||
    typeof intro !== "string"
  ) {
    return null;
  }

  const validTemplate = DEMO_TEMPLATES.find((id) => id === template);
  const content = {
    headline: headline.trim(),
    intro: intro.trim(),
  };

  if (
    !validTemplate ||
    typeof accentColor !== "string" ||
    !COLOR_VALUES.includes(accentColor) ||
    !content.headline ||
    !content.intro ||
    content.headline.length > MAX_HEADLINE ||
    content.intro.length > MAX_INTRO
  ) {
    return null;
  }

  return {
    ...draft,
    ...content,
    template: validTemplate,
    accentColor,
    nicheStyle: isIdentityKey(nicheStyle) ? nicheStyle : matchIdentity(draft.niche),
    subheadline: extras.subheadline,
    ctaLabel: extras.ctaLabel,
    about: extras.about,
    services: serviceItems,
    highlights: highlightItems,
    bookingEnabled: bookingEnabled === true,
    bookingHours: extras.bookingHours,
  };
}
