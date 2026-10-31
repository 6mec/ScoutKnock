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

const COLOR_VALUES: string[] = Object.values(DEMO_COLORS);
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
};

export type OwnDemo = PublicDemo & {
  id: string;
  slug: string;
  status: "draft" | "sent";
  expires_at: string;
  created_at: string;
};

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
  return COLOR_VALUES[sum % COLOR_VALUES.length];
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

  const { template, accentColor, headline, intro } = value as Record<
    string,
    unknown
  >;

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

  return { ...draft, ...content, template: validTemplate, accentColor };
}
