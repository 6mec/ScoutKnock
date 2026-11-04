import { SERVICE_IDS, type ReasonCode, type ServiceId } from "@/lib/radar/types";

// Travão provisório, até o limite de mensagens ser decidido por pack.
export const DAILY_MESSAGE_LIMIT = 20;
export const MAX_MESSAGE_LENGTH = 2000;

export const MESSAGE_TONES = ["normal", "shorter", "formal"] as const;
export type MessageTone = (typeof MESSAGE_TONES)[number];

export const MESSAGE_CHANNELS = ["whatsapp", "email"] as const;
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];

export type MessageSource = { kind: "company" | "contact"; id: string };
export type MessageRequest = {
  source: MessageSource;
  tone: MessageTone;
  channel: MessageChannel;
  service: ServiceId;
};

// O nome de quem assina nunca vai para o Claude: junta-se no fim, no servidor.
export type MessageInput = {
  companyName: string;
  niche: string;
  reasons: ReasonCode[];
  senderName: string | null;
  tone: MessageTone;
  channel: MessageChannel;
  service: ServiceId;
};

const SITE_CHECK_REASONS: ReasonCode[] = ["slowSite", "notMobileFriendly", "outdatedSite"];

// Estes motivos vêm da nossa verificação, e a mensagem fala deles na primeira pessoa.
export function citesSiteCheck(reasons: ReasonCode[]) {
  return reasons.some((reason) => SITE_CHECK_REASONS.includes(reason));
}

export type MessageErrorCode =
  | "provider"
  | "limit"
  | "lookupLimit"
  | "offline"
  | "notFound";

export type MessageEvent =
  | { type: "start"; isSample: boolean; citesSiteCheck: boolean }
  | { type: "text"; text: string }
  | { type: "done" }
  | { type: "error"; code: MessageErrorCode };

export type MessageUsage = { inputTokens: number; outputTokens: number };

export function parseMessageRequest(body: unknown): MessageRequest | null {
  if (typeof body !== "object" || body === null) return null;

  const { source, tone, channel, service } = body as Record<string, unknown>;
  const validTone = MESSAGE_TONES.find((value) => value === tone);
  const validChannel = MESSAGE_CHANNELS.find((value) => value === channel);
  const validService = SERVICE_IDS.find((value) => value === service);
  if (
    !validTone ||
    !validChannel ||
    !validService ||
    typeof source !== "object" ||
    source === null
  ) {
    return null;
  }

  const { kind, id } = source as Record<string, unknown>;
  if (
    (kind !== "company" && kind !== "contact") ||
    typeof id !== "string" ||
    !id ||
    id.length > 200
  ) {
    return null;
  }

  return {
    source: { kind, id },
    tone: validTone,
    channel: validChannel,
    service: validService,
  };
}

// Haiku 5.5: 0,10 $ por milhão à entrada e 0,50 $ à saída. Sem conversão de
// moeda: um dólar conta como um euro, o que erra para o lado do excesso.
export function messageCostEur({ inputTokens, outputTokens }: MessageUsage) {
  return (inputTokens * 0.1 + outputTokens * 0.5) / 1_000_000;
}

// Sem indicativo não dá para saber o país, salvo num telemóvel português de 9
// algarismos (91, 92, 93 ou 96), como quem escreve o número à mão. Nos outros, o
// WhatsApp pede o contacto.
export function whatsappUrl(message: string, phone?: string | null) {
  const number = whatsappNumber(phone) ?? "";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// Número para o wa.me: com indicativo (+ ou 00), telemóvel português de 9
// algarismos ou já com 351 à frente. Fixos e números incompletos dão null.
export function whatsappNumber(phone?: string | null) {
  const raw = phone?.trim() ?? "";
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) return digits.length >= 8 ? digits : null;
  if (raw.startsWith("00")) return digits.length >= 10 ? digits.slice(2) : null;
  if (/^9[1236]\d{7}$/.test(digits)) return `351${digits}`;
  if (/^3519[1236]\d{7}$/.test(digits)) return digits;
  return null;
}

export function emailUrl(message: string, subject: string) {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
