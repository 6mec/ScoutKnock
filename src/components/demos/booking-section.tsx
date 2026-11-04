"use client";

import { CalendarClock, Clock, MessageCircle, Phone } from "lucide-react";
import { useId, useState, type CSSProperties, type FormEvent } from "react";
import { ptPT } from "@/i18n/pt-PT";
import {
  bookingMessage,
  checkBookingRequest,
  MAX_BOOKING_NAME,
  MAX_BOOKING_NOTE,
  todayIn,
  type BookingError,
} from "@/lib/demos/booking";
import { textOn } from "@/lib/demos/identities";
import { whatsappNumber, whatsappUrl } from "@/lib/messages/rules";
import { cn } from "@/lib/utils";

const { booking: copy } = ptPT.demos;

export type BookingTheme = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  radius: string;
  card: string;
  display: CSSProperties;
};

// Pedido de marcação. No site oficial abre o WhatsApp da empresa com o pedido escrito;
// numa demo mostra só como chegaria, para nada ser enviado em nome de quem não pediu.
export function BookingSection({
  companyName,
  phone,
  services,
  hours,
  theme: t,
  official,
  preview,
}: {
  companyName: string;
  phone: string | null;
  services: string[];
  hours: string | null;
  theme: BookingTheme;
  official: boolean;
  preview: boolean;
}) {
  const ids = useId();
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<BookingError | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const canWhatsapp = whatsappNumber(phone) !== null;
  const Heading = preview ? "p" : "h2";

  const field: CSSProperties = { backgroundColor: t.background, borderColor: t.border, color: t.text };
  const control = cn("min-h-12 w-full border px-3 text-16", t.radius === "rounded-[999px]" ? "rounded-[14px]" : t.radius);
  const button = (
    <span
      style={{ backgroundColor: t.accent, color: textOn(t.accent) }}
      className={cn("inline-flex min-h-12 items-center justify-center gap-2 px-6 text-15 font-semibold", t.radius)}
    >
      <MessageCircle aria-hidden="true" size={18} strokeWidth={2} />
      {copy.submit}
    </span>
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const request = { service, date, time, name, note };
    const problem = checkBookingRequest(request, todayIn());
    setError(problem);
    if (problem) return;
    const message = bookingMessage(request);
    setResult(message);
    if (official && canWhatsapp) {
      window.open(whatsappUrl(message, phone), "_blank", "noopener,noreferrer");
    }
  }

  return (
    <section
      id={preview ? undefined : "marcar"}
      data-testid="booking-section"
      style={{ backgroundColor: t.background }}
    >
      <div className="mx-auto grid max-w-260 gap-8 px-6 py-16 @3xl:grid-cols-[0.8fr_1.2fr] @3xl:py-20">
        <div className="flex flex-col gap-4">
          <span
            aria-hidden="true"
            style={{ backgroundColor: `${t.accent}1f`, color: t.accent }}
            className={cn("inline-flex size-12 items-center justify-center", t.card)}
          >
            <CalendarClock size={22} strokeWidth={2} />
          </span>
          <Heading style={t.display} className="text-32 leading-tight font-bold tracking-tight @3xl:text-44">
            {copy.title}
          </Heading>
          <p style={{ color: t.muted }} className="text-16 leading-relaxed">
            {copy.lead(companyName)}
          </p>
          {hours && (
            <p className="flex items-start gap-2 text-15">
              <Clock aria-hidden="true" size={18} strokeWidth={2} className="mt-0.5 shrink-0" style={{ color: t.accent }} />
              <span>
                <span className="font-semibold">{copy.hours}: </span>
                {hours}
              </span>
            </p>
          )}
        </div>

        {preview ? (
          // Na prévia não há campos: a galeria põe o cartão inteiro dentro de uma ligação.
          <div aria-hidden="true" style={{ backgroundColor: t.surface, borderColor: t.border }} className={cn("flex flex-col gap-3 border p-6", t.card)}>
            <div className="flex flex-wrap gap-2">
              {services.slice(0, 4).map((title) => (
                <span key={title} style={{ borderColor: t.border }} className="rounded-full border px-3 py-1.5 text-14">
                  {title}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <span style={field} className={cn(control, "flex items-center")}>{copy.date}</span>
              <span style={field} className={cn(control, "flex items-center")}>{copy.time}</span>
            </div>
            {button}
          </div>
        ) : official && !canWhatsapp ? (
          <div className="flex flex-col items-start gap-3">
            {phone ? (
              <a
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                style={{ backgroundColor: t.accent, color: textOn(t.accent) }}
                className={cn("inline-flex min-h-12 items-center gap-2 px-6 text-15 font-semibold", t.radius)}
              >
                <Phone aria-hidden="true" size={18} strokeWidth={2} />
                {copy.callToBook}
              </a>
            ) : (
              <p style={{ color: t.muted }}>{copy.noPhone}</p>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ backgroundColor: t.surface, borderColor: t.border }}
            className={cn("flex flex-col gap-4 border p-6", t.card)}
          >
            {!official && (
              <p role="note" className="rounded-md bg-[#FFB547]/20 px-3 py-2 text-14" style={{ color: t.text }}>
                {copy.demoNote}
              </p>
            )}
            {services.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${ids}-service`} className="text-14 font-semibold">{copy.service}</label>
                <select
                  id={`${ids}-service`}
                  value={service}
                  onChange={(event) => setService(event.target.value)}
                  style={field}
                  className={control}
                >
                  <option value="">{copy.anyService}</option>
                  {services.map((title) => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid gap-4 @md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${ids}-date`} className="text-14 font-semibold">{copy.date}</label>
                <input
                  id={`${ids}-date`}
                  type="date"
                  required
                  min={todayIn()}
                  value={date}
                  aria-invalid={error === "date" || undefined}
                  aria-describedby={error === "date" ? `${ids}-error` : undefined}
                  onChange={(event) => setDate(event.target.value)}
                  style={field}
                  className={control}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${ids}-time`} className="text-14 font-semibold">{copy.time}</label>
                <input
                  id={`${ids}-time`}
                  type="time"
                  required
                  step={900}
                  value={time}
                  aria-invalid={error === "time" || undefined}
                  aria-describedby={error === "time" ? `${ids}-error` : undefined}
                  onChange={(event) => setTime(event.target.value)}
                  style={field}
                  className={control}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${ids}-name`} className="text-14 font-semibold">{copy.name}</label>
              <input
                id={`${ids}-name`}
                required
                autoComplete="name"
                maxLength={MAX_BOOKING_NAME}
                value={name}
                aria-invalid={error === "name" || undefined}
                aria-describedby={error === "name" ? `${ids}-error` : undefined}
                onChange={(event) => setName(event.target.value)}
                style={field}
                className={control}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${ids}-note`} className="text-14 font-semibold">{copy.note}</label>
              <input
                id={`${ids}-note`}
                maxLength={MAX_BOOKING_NOTE}
                value={note}
                placeholder={copy.notePlaceholder}
                onChange={(event) => setNote(event.target.value)}
                style={field}
                className={control}
              />
            </div>
            <p id={`${ids}-error`} role="alert" style={{ color: t.text }} className="text-14 font-semibold empty:hidden">
              {error ? copy.errors[error] : ""}
            </p>
            <button type="submit" data-testid="booking-submit" className="self-start focus-visible:outline-2 focus-visible:outline-offset-2">
              {button}
            </button>
            <div aria-live="polite">
              {result && (
                <div
                  data-testid="booking-result"
                  style={{ borderColor: t.border }}
                  className={cn("flex flex-col gap-2 border p-4", t.card)}
                >
                  <p className="text-14 font-semibold">{official ? copy.sentNote : copy.previewTitle}</p>
                  <p style={{ color: t.muted }} className="text-15 whitespace-pre-line">{result}</p>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
