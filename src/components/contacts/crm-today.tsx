"use client";

import {
  ChartColumn,
  ChevronDown,
  Filter,
  ListOrdered,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PanelHeader } from "@/components/ui/panel-header";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { setDailyGoal } from "@/lib/contacts/actions";
import {
  contactedToday,
  dailyPace,
  MAX_DAILY_GOAL,
  nextInQueue,
  queueSize,
  type ContactEvent,
} from "@/lib/contacts/crm";
import type { Contact, ContactStatus } from "@/lib/contacts/rules";
import { whatsappNumber } from "@/lib/messages/rules";
import { cn } from "@/lib/utils";
import { Funnel } from "@/components/dashboard/funnel";
import type { FunnelStage } from "@/lib/dashboard/metrics";
import { formatDay } from "./contacts-board";
import { PlannerPanel } from "./planner-panel";
import { WhatsappCallButton } from "./whatsapp-call-button";

const { contacts: copy } = ptPT;
const weekday = new Intl.DateTimeFormat("pt-PT", { weekday: "narrow", timeZone: "UTC" });

function Panel({
  id,
  title,
  icon,
  tone,
  className,
  children,
}: {
  id: string;
  title: string;
  icon: LucideIcon;
  tone?: "accent" | "amber" | "info" | "muted";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      data-testid={`crm-${id}`}
      className={cn(
        "panel flex min-w-0 flex-col gap-3 p-4",
        className,
      )}
    >
      <PanelHeader id={id} icon={icon} title={title} tone={tone} />
      {children}
    </section>
  );
}

function GoalPanel({
  done,
  goal,
  onGoalChange,
}: {
  done: number;
  goal: number;
  onGoalChange: (goal: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goal));
  const [saving, startSaving] = useTransition();
  const reached = done >= goal;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const value = Number(draft);
    startSaving(async () => {
      const { ok } = await setDailyGoal(value);
      if (ok) {
        onGoalChange(value);
        setEditing(false);
      } else {
        toast.error(copy.crm.goalInvalid(MAX_DAILY_GOAL));
      }
    });
  }

  return (
    <Panel id="meta" title={copy.crm.goalTitle} icon={Target}>
      <p className="flex items-baseline gap-1.5">
        <span data-testid="crm-goal-done" className="type-number text-32 leading-none font-semibold">
          {done}
        </span>
        <span className="type-number text-16 text-muted">/ {goal}</span>
      </p>
      <p className="text-13 text-muted">{copy.crm.goalLine}</p>
      <Progress
        value={Math.min(100, Math.round((done / goal) * 100))}
        label={copy.crm.goalProgress(done, goal)}
      />
      {reached && (
        <p role="status" className="text-14 text-accent">
          {copy.crm.goalReached}
        </p>
      )}
      {editing ? (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <Field label={copy.crm.goalLabel} className="w-32">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_DAILY_GOAL}
              required
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </Field>
          <Button type="submit" variant="secondary" loading={saving} loadingText={copy.saving}>
            {copy.save}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            {copy.removeCancel}
          </Button>
        </form>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          className="mt-auto self-start"
          onClick={() => {
            setDraft(String(goal));
            setEditing(true);
          }}
        >
          {copy.crm.goalChange}
        </Button>
      )}
    </Panel>
  );
}

// Barras dos últimos 14 dias; a de hoje fica destacada. Dica ao passar e tabela
// para leitores de ecrã.
function PacePanel({ pace, goal }: { pace: { day: string; count: number }[]; goal: number }) {
  const max = Math.max(goal, ...pace.map(({ count }) => count), 1);
  const total = pace.reduce((sum, { count }) => sum + count, 0);

  return (
    // Fica dentro de "Números dos contactos", fechado, por isso também aparece no telemóvel.
    <Panel id="ritmo" title={copy.crm.paceTitle} icon={ChartColumn} tone="muted">
      <p className="text-14 text-muted">{copy.crm.paceLine(total)}</p>
      <div aria-hidden="true" className="relative flex h-24 items-end gap-0.5 border-b border-border">
        <span
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border-strong"
          style={{ bottom: `${(goal / max) * 100}%` }}
        />
        {pace.map(({ day, count }, index) => (
          <div
            key={day}
            title={`${formatDay(day)}: ${copy.crm.paceTooltip(count)}`}
            className="group flex h-full flex-1 items-end"
          >
            <div
              className={cn(
                "w-full rounded-t-[4px] transition-opacity duration-(--duration-fast) group-hover:opacity-80",
                index === pace.length - 1 ? "bg-accent" : "bg-muted/60",
                count === 0 && "h-0.5 rounded-none bg-border",
              )}
              style={count ? { height: `${(count / max) * 100}%` } : undefined}
            />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="type-number flex gap-0.5 text-12 text-muted">
        {pace.map(({ day }) => (
          <span key={day} className="flex-1 text-center">
            {weekday.format(new Date(`${day}T12:00:00Z`))}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{copy.crm.paceTitle}</caption>
        <tbody>
          {pace.map(({ day, count }) => (
            <tr key={day}>
              <th scope="row">{formatDay(day)}</th>
              <td>{copy.crm.paceTooltip(count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function QueuePanel({
  contacts,
  whatsappTemplate,
  onOpen,
  onStatusChange,
}: {
  contacts: Contact[];
  whatsappTemplate: string | null;
  onOpen: (id: string) => void;
  onStatusChange: (id: string, status: ContactStatus) => void;
}) {
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(new Set());
  const next = nextInQueue(contacts, skipped);
  const size = queueSize(contacts);

  return (
    <Panel id="fila" title={copy.crm.queueTitle(size)} icon={ListOrdered} tone="info" className="panel-glow">
      {next ? (
        <>
          <p data-testid="crm-queue-next" className="type-heading text-18 break-words">
            {next.label}
          </p>
          <p className="text-13 text-muted">{copy.crm.queueHint}</p>
          <div className="mt-auto flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onOpen(next.id)}>
              {copy.crm.queueOpen}
            </Button>
            {whatsappNumber(next.manual_phone ?? next.confirmed_contact) ? (
              <WhatsappCallButton
                size="sm"
                contact={next}
                phone={next.manual_phone ?? next.confirmed_contact}
                template={whatsappTemplate}
                onStatusChange={onStatusChange}
              />
            ) : (
              <Button size="sm" variant="secondary" onClick={() => onStatusChange(next.id, "contacted")}>
                {copy.crm.queueContacted}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSkipped((current) => new Set(current).add(next.id))}
            >
              {copy.crm.queueSkip}
            </Button>
          </div>
        </>
      ) : (
        <p className="text-14 text-muted">
          {size > 0 ? copy.crm.queueSkippedAll : copy.crm.queueEmpty}
        </p>
      )}
      {skipped.size > 0 && (
        <Button size="sm" variant="ghost" className="self-start" onClick={() => setSkipped(new Set())}>
          {copy.crm.queueReset}
        </Button>
      )}
    </Panel>
  );
}

// O dia, no Dashboard: a meta e a próxima da fila. Os retornos estão nas "Próximas tarefas".
export function TodayPanels({
  contacts,
  events,
  dailyGoal,
  now,
  whatsappTemplate,
  onGoalChange,
  onOpen,
  onStatusChange,
}: {
  contacts: Contact[];
  events: ContactEvent[];
  dailyGoal: number;
  now: number;
  whatsappTemplate: string | null;
  onGoalChange: (goal: number) => void;
  onOpen: (id: string) => void;
  onStatusChange: (id: string, status: ContactStatus) => void;
}) {
  return (
    <>
      <GoalPanel done={contactedToday(events, now)} goal={dailyGoal} onGoalChange={onGoalChange} />
      <QueuePanel
        contacts={contacts}
        whatsappTemplate={whatsappTemplate}
        onOpen={onOpen}
        onStatusChange={onStatusChange}
      />
    </>
  );
}

// Nos Contactos, fechado por omissão: o ritmo, o funil e o planeador. A lista vem primeiro.
export function ContactNumbers({
  contacts,
  events,
  dailyGoal,
  now,
  funnel,
}: {
  contacts: Contact[];
  events: ContactEvent[];
  dailyGoal: number;
  now: number;
  funnel: { stage: FunnelStage; count: number }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <section aria-labelledby="numeros-contactos" className="panel flex flex-col gap-3 p-4" data-testid="contact-numbers">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="numeros-contactos-conteudo"
        onClick={() => setOpen((current) => !current)}
        className="focus-ring -m-1 flex min-h-11 items-center justify-between gap-3 rounded-md p-1 text-left"
      >
        <span className="flex min-w-0 items-start gap-3">
          <span aria-hidden="true" className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-raised text-muted">
            <ChartColumn size={16} strokeWidth={1.9} />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5 pt-0.5">
            <span id="numeros-contactos" className="text-14 leading-tight font-semibold">{copy.crm.numbersTitle}</span>
            <span className="text-13 text-muted">{copy.crm.numbersHint}</span>
          </span>
        </span>
        <ChevronDown aria-hidden="true" size={18} className={cn("shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div id="numeros-contactos-conteudo" className="flex flex-col gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <PacePanel pace={dailyPace(events, now)} goal={dailyGoal} />
            <Panel id="funil" title={ptPT.dashboard.funnel.title} icon={Filter}>
              <p className="-mt-1 text-13 text-muted">{ptPT.dashboard.funnel.note}</p>
              <Funnel data={funnel} />
            </Panel>
          </div>
          <PlannerPanel contacts={contacts} />
        </div>
      )}
    </section>
  );
}
