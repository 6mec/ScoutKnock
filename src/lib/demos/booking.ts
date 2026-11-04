import { ptPT } from "@/i18n/pt-PT";
import type { IdentityKey } from "./identities";

const { booking: copy } = ptPT.demos;

// Pedidos de marcação: o cliente escolhe o serviço, o dia e a hora, e o pedido segue
// por WhatsApp para a empresa, já escrito. Não há agenda nem lembretes, nada fica
// guardado e não custa nada. A marcação só existe quando a empresa responder.

// Nichos onde se marca hora: a secção vem ligada ao criar a demo.
export const BOOKING_IDENTITIES: readonly IdentityKey[] = [
  "barbearia",
  "cabeleireiro",
  "clinica",
  "dentista",
  "ginasio",
  "animais",
  "oficina",
  "restaurante",
];

export const MAX_BOOKING_HOURS = 120;
export const MAX_BOOKING_NAME = 60;
export const MAX_BOOKING_NOTE = 200;

export function bookingByDefault(identity: IdentityKey) {
  return BOOKING_IDENTITIES.includes(identity);
}

export type BookingRequest = {
  service: string;
  date: string;
  time: string;
  name: string;
  note: string;
};

export type BookingError = "name" | "date" | "time";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// `today` no formato AAAA-MM-DD, no fuso de quem marca. Não se marca para o passado.
export function checkBookingRequest(request: BookingRequest, today: string): BookingError | null {
  const name = request.name.trim();
  if (!name || name.length > MAX_BOOKING_NAME) return "name";
  if (!DATE.test(request.date) || Number.isNaN(Date.parse(`${request.date}T12:00:00Z`)) || request.date < today) {
    return "date";
  }
  if (!TIME.test(request.time)) return "time";
  return null;
}

const dateFormat = new Intl.DateTimeFormat("pt-PT", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

export function formatBookingDate(date: string) {
  return dateFormat.format(new Date(`${date}T12:00:00Z`));
}

export function bookingMessage(request: BookingRequest) {
  const note = request.note.trim().slice(0, MAX_BOOKING_NOTE);
  return copy.message({
    service: request.service.trim() || null,
    date: formatBookingDate(request.date),
    time: request.time,
    name: request.name.trim(),
    note: note || null,
  });
}

export function todayIn(timeZone = "Europe/Lisbon", now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}
