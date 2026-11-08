// Conteúdo fixo da montra pública (portfólio): a demonstração de marcações, as tecnologias,
// a pré-visualização "Vê o teu negócio com um site" e o "Monta o teu projeto".
// Nada daqui é guardado nem enviado: é tudo no browser de quem visita.

// O negócio da demonstração de marcações. Um só sítio: para o trocar, muda só esta linha.
export const DEMO_BUSINESS_NAME = "Luluzote Barber Shop";

// Os serviços que o barbeiro deu (projeto da Luluzote), sem preços nem durações.
export const DEMO_SERVICES = ["Corte", "Cabelo e barba", "Barba", "Pente 0 + barba"] as const;

// Horário de exemplo: das 19:30 às 22:00, de 30 em 30 minutos. Domingo fechado.
export const DEMO_SLOTS = ["19:30", "20:00", "20:30", "21:00", "21:30", "22:00"] as const;
export const DEMO_CLOSED_WEEKDAY = 0;
export const DEMO_DAYS = 6;

// Os próximos dias abertos a partir de `today` (AAAA-MM-DD), sem o dia de fecho.
export function demoDays(today: string, count = DEMO_DAYS) {
  const days: string[] = [];
  const date = new Date(`${today}T12:00:00Z`);
  while (days.length < count) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (date.getUTCDay() !== DEMO_CLOSED_WEEKDAY) days.push(date.toISOString().slice(0, 10));
  }
  return days;
}

export const TECHNOLOGIES = ["Next.js", "React", "TypeScript", "Tailwind", "Supabase", "Netlify", "PWA"] as const;

// "Vê o teu negócio com um site": os tipos e as cores que o visitante pode escolher.
export const PREVIEW_KINDS = ["barbershop", "restaurant", "clinic", "shop"] as const;
export type PreviewKind = (typeof PREVIEW_KINDS)[number];

export const PREVIEW_COLORS = [
  { id: "sage", hex: "#647B63" },
  { id: "navy", hex: "#2F4A6D" },
  { id: "terracotta", hex: "#B5583A" },
  { id: "charcoal", hex: "#2B2C29" },
  { id: "gold", hex: "#9A7B3F" },
  { id: "plum", hex: "#6E3F62" },
] as const;
export type PreviewColor = (typeof PREVIEW_COLORS)[number]["id"];

// "Monta o teu projeto": tipo, funcionalidades e prazo. Sem preços.
export const BUILDER_KINDS = ["site", "booking", "app", "automation"] as const;
export const BUILDER_FEATURES = ["booking", "services", "gallery", "contact", "maps", "reviews", "languages", "clientArea"] as const;
export const BUILDER_DEADLINES = ["flexible", "month", "twoWeeks", "asap"] as const;
export type BuilderKind = (typeof BUILDER_KINDS)[number];
export type BuilderFeature = (typeof BUILDER_FEATURES)[number];
export type BuilderDeadline = (typeof BUILDER_DEADLINES)[number];

// A mensagem do WhatsApp, já escrita com o que o visitante escolheu.
export function builderMessage(
  labels: {
    greeting: (name: string) => string;
    kind: (kind: string) => string;
    features: (list: string) => string;
    noFeatures: string;
    deadline: (deadline: string) => string;
    closing: string;
  },
  choice: { owner: string; kind: string; features: string[]; deadline: string },
) {
  return [
    labels.greeting(choice.owner),
    labels.kind(choice.kind),
    choice.features.length > 0 ? labels.features(choice.features.join(", ")) : labels.noFeatures,
    labels.deadline(choice.deadline),
    labels.closing,
  ].join("\n");
}
