"use client";

import { Ban, Check, Copy, ExternalLink, MessageCircle, SkipForward } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { markContactedWithReturn, setDoNotContact } from "@/lib/contacts/actions";
import {
  RETURN_DAYS,
  contactedToday,
  fillTemplate,
  nextInQueue,
  queueList,
  queueSize,
  type ContactEvent,
  type ReturnDays,
} from "@/lib/contacts/crm";
import type { Contact } from "@/lib/contacts/rules";
import { demoLinkFor, missingVariables, type DemoLinks } from "@/lib/demos/links";
import { whatsappNumber, whatsappUrl } from "@/lib/messages/rules";
import { cn } from "@/lib/utils";
import { templateText } from "./whatsapp-call-button";

const copy = ptPT.contacts.session;
const timeFormat = new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" });

type LogEntry = { id: string; label: string; outcome: "contacted" | "skipped" | "blocked"; days?: ReturnDays; at: number };

// A sessão: uma empresa de cada vez, com a mensagem preenchida e o retorno escolhido.
// O envio é sempre manual (abre o WhatsApp); aqui só se regista o que aconteceu.
export function SessionScreen({
  initial,
  events: initialEvents,
  dailyGoal,
  whatsappTemplate,
  portfolioUrl,
  demoLinks,
}: {
  initial: Contact[];
  events: ContactEvent[];
  dailyGoal: number;
  whatsappTemplate: string | null;
  portfolioUrl: string | null;
  demoLinks: DemoLinks;
}) {
  const [contacts, setContacts] = useState(initial);
  const [events, setEvents] = useState(initialEvents);
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(new Set());
  const [days, setDays] = useState<ReturnDays>(3);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [now] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();

  const current = nextInQueue(contacts, skipped);
  const upcoming = queueList(contacts, new Set([...skipped, ...(current ? [current.id] : [])]), 5);
  const size = queueSize(contacts);
  const done = contactedToday(events, now);
  const template = templateText(whatsappTemplate);
  const demo = current ? demoLinkFor(demoLinks, current) : null;
  const message = current ? fillTemplate(template, current.label, portfolioUrl, demo) : "";
  const phone = current ? (current.manual_phone ?? current.confirmed_contact) : null;
  const missing = current ? missingVariables(template, { demo, portfolio: portfolioUrl }) : [];

  function remember(entry: Omit<LogEntry, "at">) {
    setLog((list) => [{ ...entry, at: Date.now() }, ...list]);
  }

  function contacted() {
    if (!current) return;
    const contact = current;
    startTransition(async () => {
      const { ok } = await markContactedWithReturn(contact.id, days);
      if (!ok) {
        toast.error(ptPT.contacts.errors.generic);
        return;
      }
      const at = new Date().toISOString();
      setContacts((list) => list.map((item) => (item.id === contact.id ? { ...item, status: "contacted", last_contacted_at: at } : item)));
      setEvents((list) => [...list, { contact_id: contact.id, kind: "status", status: "contacted", created_at: at }]);
      remember({ id: contact.id, label: contact.label, outcome: "contacted", days });
      toast.success(copy.saved);
    });
  }

  function skip() {
    if (!current) return;
    setSkipped((set) => new Set(set).add(current.id));
    remember({ id: current.id, label: current.label, outcome: "skipped" });
  }

  function block() {
    if (!current) return;
    const contact = current;
    startTransition(async () => {
      const { ok } = await setDoNotContact(contact.id, true);
      if (!ok) {
        toast.error(ptPT.contacts.errors.generic);
        return;
      }
      setContacts((list) => list.map((item) => (item.id === contact.id ? { ...item, do_not_contact: true } : item)));
      remember({ id: contact.id, label: contact.label, outcome: "blocked" });
      toast.success(copy.blocked);
    });
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      toast.success(copy.copied);
    } catch {
      toast.error(ptPT.messages.copyFailed);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-300 gap-4 px-4 pt-6 pb-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:px-8">
      {/* A empresa de agora. */}
      <section aria-labelledby="sessao-agora" className="panel flex flex-col gap-5 p-5 sm:p-6" data-testid="session-current">
        <div className="flex items-center justify-between gap-3">
          <h2 id="sessao-agora" className="text-13 font-medium tracking-[0.06em] text-muted uppercase">
            {copy.current}
          </h2>
          <span className="text-13 text-muted tabular-nums">{ptPT.contacts.crm.queueTitle(size)}</span>
        </div>
        {current ? (
          <>
            <div className="flex flex-col gap-1">
              <p className="type-heading text-24 break-words" data-testid="session-company">
                {current.label}
              </p>
              {(current.manual_niche || current.manual_locality) && (
                <p className="text-14 text-muted">{copy.niche(current.manual_niche ?? "", current.manual_locality ?? "")}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-13 font-semibold">{copy.message}</h3>
              <p className="rounded-md border border-border bg-surface-raised/50 p-3 text-14 leading-relaxed whitespace-pre-line" data-testid="session-message">
                {message}
              </p>
              {missing.length > 0 && (
                <p className="text-13 text-amber">
                  {ptPT.contacts.crm.missingVariables(missing.map((item) => ptPT.contacts.crm.variableNames[item]).join(" e "))}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {whatsappNumber(phone) ? (
                  <Button asChild>
                    <a href={whatsappUrl(message, phone)} target="_blank" rel="noreferrer noopener" data-testid="session-whatsapp">
                      <MessageCircle aria-hidden="true" size={16} />
                      {copy.openWhatsapp}
                    </a>
                  </Button>
                ) : (
                  <p className="text-13 text-muted">{copy.noPhone}</p>
                )}
                <Button variant="secondary" onClick={copyMessage}>
                  <Copy aria-hidden="true" size={15} />
                  {copy.copy}
                </Button>
                <Button asChild variant="ghost">
                  <Link href={`/painel/contactos?contacto=${current.id}`}>
                    <ExternalLink aria-hidden="true" size={15} />
                    {copy.openSheet}
                  </Link>
                </Button>
              </div>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-13 font-semibold">{copy.returnIn}</legend>
              <div className="flex flex-wrap gap-2">
                {RETURN_DAYS.filter((value) => value > 0).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={days === value}
                    onClick={() => setDays(value)}
                    className={cn(
                      "focus-ring inline-flex min-h-10 items-center rounded-pill border px-3.5 text-14 transition-colors",
                      days === value ? "border-accent bg-accent-soft font-medium text-foreground" : "border-border text-muted hovered:text-foreground",
                    )}
                  >
                    {copy.returns[value]}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Button onClick={contacted} loading={pending} loadingText={ptPT.contacts.saving} data-testid="session-contacted">
                <Check aria-hidden="true" size={16} />
                {copy.contacted}
              </Button>
              <Button variant="secondary" onClick={skip} disabled={pending} data-testid="session-skip">
                <SkipForward aria-hidden="true" size={16} />
                {copy.skip}
              </Button>
              <Button variant="ghost" onClick={block} disabled={pending} data-testid="session-block">
                <Ban aria-hidden="true" size={16} />
                {copy.doNotContact}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-14 text-muted">{size > 0 ? copy.skippedAll : copy.empty}</p>
            {skipped.size > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setSkipped(new Set())}>
                {copy.resetSkipped}
              </Button>
            )}
          </div>
        )}
      </section>

      <div className="flex flex-col gap-4">
        {/* Meta do dia. */}
        <section aria-labelledby="sessao-meta" className="panel flex flex-col gap-3 p-5" data-testid="session-goal">
          <h2 id="sessao-meta" className="text-15 font-semibold">
            {ptPT.contacts.crm.goalTitle}
          </h2>
          <p className="type-number text-32 leading-none">
            {done} <span className="text-16 text-muted">/ {dailyGoal}</span>
          </p>
          <Progress value={Math.min(100, Math.round((done / dailyGoal) * 100))} label={ptPT.contacts.crm.goalTitle} />
        </section>

        {/* As próximas da fila. */}
        <section aria-labelledby="sessao-proximas" className="panel flex flex-col gap-3 p-5">
          <h2 id="sessao-proximas" className="text-15 font-semibold">
            {copy.next}
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-14 text-muted">{copy.nextEmpty}</p>
          ) : (
            <ol className="flex flex-col gap-1.5" data-testid="session-next">
              {upcoming.map((contact) => (
                <li key={contact.id} className="truncate text-14">
                  {contact.label}
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* O que se fez nesta sessão. */}
        <section aria-labelledby="sessao-registo" className="panel flex flex-col gap-3 p-5">
          <h2 id="sessao-registo" className="text-15 font-semibold">
            {copy.log}
          </h2>
          {log.length === 0 ? (
            <p className="text-14 text-muted">{copy.logEmpty}</p>
          ) : (
            <ul className="flex flex-col gap-2" data-testid="session-log">
              {log.map((entry) => (
                <li key={`${entry.id}-${entry.at}`} className="flex flex-wrap items-center justify-between gap-2 text-14">
                  <span className="min-w-0 truncate">{entry.label}</span>
                  <span className="flex items-center gap-2 text-13 text-muted">
                    <Badge variant={entry.outcome === "contacted" ? "accent" : "outline"}>{copy.outcomes[entry.outcome]}</Badge>
                    {entry.days !== undefined && copy.returnLine(copy.returns[entry.days])}
                    <span className="tabular-nums">{timeFormat.format(entry.at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
