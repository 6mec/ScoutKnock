import { isValidEmail } from "@/lib/auth/validation";

export const CONSENT_VERSION = "2026-11-01";
export const RESEND_COOLDOWN_MS = 60 * 60 * 1000;
// Limite diário do plano gratuito do Resend.
export const DAILY_EMAIL_LIMIT = 100;

const SERVICES = ["sites", "social_media", "design", "marketing", "other"];

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidWaitlistEmail(email: string) {
  return email.length <= 254 && isValidEmail(email);
}

// Serviço opcional: tudo o que não for uma opção conhecida fica vazio.
export function parseService(service: string) {
  return SERVICES.includes(service) ? service : null;
}

export function canResendEmail(lastSentAt: string, now: number) {
  return now - new Date(lastSentAt).getTime() >= RESEND_COOLDOWN_MS;
}
