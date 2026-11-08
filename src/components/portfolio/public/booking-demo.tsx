"use client";

import { CalendarCheck, Check, RotateCcw, Scissors } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ptPT } from "@/i18n/pt-PT";
import { DEMO_BUSINESS_NAME, DEMO_SERVICES, DEMO_SLOTS, demoDays } from "@/lib/portfolio/showcase";
import { cn } from "@/lib/utils";
import { pf } from "./styles";

const copy = ptPT.portfolio.showcase.demo;
const dayFormat = new Intl.DateTimeFormat("pt-PT", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const longDay = new Intl.DateTimeFormat("pt-PT", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const lisbonToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(new Date());

// Demonstração de marcações, toda no browser: não está ligada ao sistema real e não envia
// nada. No fim diz isso mesmo.
export function BookingDemo() {
  const [days] = useState(() => demoDays(lisbonToday()));
  const [service, setService] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);
  const [missing, setMissing] = useState(false);

  function confirm(event: FormEvent) {
    event.preventDefault();
    if (!service || !day || !time) {
      setMissing(true);
      return;
    }
    setDone(true);
  }

  function reset() {
    setService(null);
    setDay(null);
    setTime(null);
    setName("");
    setDone(false);
    setMissing(false);
  }

  const dateLabel = (value: string) => dayFormat.format(new Date(`${value}T12:00:00Z`));

  return (
    <div className={cn(pf.card, "overflow-hidden")} data-testid="booking-demo">
      <div className="flex items-center justify-between gap-3 border-b border-[#EAEAE5] bg-[#20211F] px-5 py-4 text-white">
        <span className="flex items-center gap-3">
          <span aria-hidden="true" className="inline-flex size-9 items-center justify-center rounded-full bg-white/10">
            <Scissors size={17} />
          </span>
          <span className="text-15 font-semibold">{DEMO_BUSINESS_NAME}</span>
        </span>
        <span className="rounded-full border border-[#C5A46D]/60 px-2.5 py-0.5 text-12 font-semibold tracking-wide text-[#E8D3A8] uppercase">
          {copy.badge}
        </span>
      </div>

      {done ? (
        <div role="status" className="flex flex-col items-start gap-4 p-6 sm:p-8" data-testid="booking-done">
          <span aria-hidden="true" className="inline-flex size-12 items-center justify-center rounded-full bg-[#647B63]/12 text-[#4E6350]">
            <Check size={24} strokeWidth={2.2} />
          </span>
          <p className="text-24 font-semibold tracking-[-0.02em]">{copy.doneTitle}</p>
          <p className={cn("text-15 leading-relaxed", pf.muted)}>
            {copy.doneText(service ?? "", longDay.format(new Date(`${day}T12:00:00Z`)), time ?? "")}
          </p>
          <button type="button" onClick={reset} className={cn(pf.secondary, pf.focus)}>
            <RotateCcw aria-hidden="true" size={16} />
            {copy.again}
          </button>
        </div>
      ) : (
        <form onSubmit={confirm} className="flex flex-col gap-6 p-5 sm:p-6" noValidate>
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2 text-14 font-semibold">{copy.service}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {DEMO_SERVICES.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={service === item}
                  onClick={() => setService(item)}
                  className={cn(
                    "flex min-h-12 items-center justify-between rounded-xl border px-4 text-left text-15 font-medium transition-colors",
                    service === item ? "border-[#647B63] bg-[#647B63]/10 text-[#20211F]" : "border-[#EAEAE5] bg-white hover:border-[#647B63]",
                    pf.focus,
                  )}
                >
                  {item}
                  {service === item && <Check aria-hidden="true" size={16} className="text-[#4E6350]" />}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2 text-14 font-semibold">{copy.day}</legend>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {days.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={day === value}
                  onClick={() => setDay(value)}
                  className={cn(pf.chip, "shrink-0 capitalize", day === value ? pf.chipOn : pf.chipOff, pf.focus)}
                >
                  {dateLabel(value)}
                </button>
              ))}
            </div>
            <p className={cn("text-13", pf.muted)}>{copy.closed}</p>
          </fieldset>

          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2 text-14 font-semibold">{copy.time}</legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {DEMO_SLOTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={time === value}
                  onClick={() => setTime(value)}
                  className={cn(pf.chip, "justify-center tabular-nums", time === value ? pf.chipOn : pf.chipOff, pf.focus)}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="demo-name" className="text-14 font-semibold">
              {copy.name}
            </label>
            <input
              id="demo-name"
              value={name}
              maxLength={40}
              placeholder={copy.namePlaceholder}
              aria-describedby="demo-name-note"
              autoComplete="off"
              onChange={(event) => setName(event.target.value)}
              className={pf.input}
            />
            <p id="demo-name-note" className={cn("text-13", pf.muted)}>
              {copy.nameNote}
            </p>
          </div>

          {missing && (!service || !day || !time) && (
            <p role="alert" className="text-14 font-medium text-[#9A3F2B]">
              {copy.incomplete}
            </p>
          )}
          <button type="submit" className={cn(pf.primary, pf.focus, "self-start")} data-testid="booking-confirm">
            <CalendarCheck aria-hidden="true" size={18} />
            {copy.confirm}
          </button>
        </form>
      )}
    </div>
  );
}
