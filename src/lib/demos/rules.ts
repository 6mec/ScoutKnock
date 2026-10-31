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

export type DemoContent = {
  companyName: string;
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

export function createDemoSlug() {
  // O resto da divisão enviesa muito pouco e o código não é um segredo de autenticação.
  return Array.from(crypto.getRandomValues(new Uint8Array(SLUG_LENGTH)))
    .map((byte) => SLUG_ALPHABET[byte % SLUG_ALPHABET.length])
    .join("");
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

export function parseDemoContent(value: unknown): DemoContent | null {
  if (typeof value !== "object" || value === null) return null;

  const { companyName, template, accentColor, headline, intro } = value as Record<
    string,
    unknown
  >;

  if (
    typeof companyName !== "string" ||
    typeof headline !== "string" ||
    typeof intro !== "string"
  ) {
    return null;
  }

  const validTemplate = DEMO_TEMPLATES.find((id) => id === template);
  const content = {
    companyName: companyName.trim(),
    headline: headline.trim(),
    intro: intro.trim(),
  };

  if (
    !validTemplate ||
    typeof accentColor !== "string" ||
    !COLOR_VALUES.includes(accentColor) ||
    !content.companyName ||
    !content.headline ||
    !content.intro ||
    content.companyName.length > MAX_COMPANY_NAME ||
    content.headline.length > MAX_HEADLINE ||
    content.intro.length > MAX_INTRO
  ) {
    return null;
  }

  return { ...content, template: validTemplate, accentColor };
}
