"use client";

import {
  CalendarClock,
  ChartColumn,
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
  dueReturns,
  MAX_DAILY_GOAL,
  nextInQueue,
  queueSize,
  type ContactEvent,
} from "@/lib/contacts/crm";
import type { Contact, ContactStatus } from "@/lib/contacts/rules";
import { whatsappNumber } from "@/lib/messages/rules";
import { cn } from "@/lib/utils";
import { formatDay } from "./contacts-board";
import { WhatsappCallButton } from "./whatsapp-call-button";

const { contacts: copy } = ptPT;
const MAX_RETURNS_SHOWN = 4;
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
    // No telemóvel o gráfico fica de fora, para o quadro não ficar tão abaixo.
    <Panel
      id="ritmo"
      title={copy.crm.paceTitle}
      icon={ChartColumn}
      tone="muted"
      className="hidden md:flex"
    >
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

function ReturnsPanel({
  returns,
  today,
  onOpen,
}: {
  returns: Contact[];
  today: string;
  onOpen: (id: string) => void;
}) {
  return (
    <Panel
      id="retornos"
      title={copy.crm.returnsTitle(returns.length)}
      icon={CalendarClock}
      tone={returns.length ? "amber" : "muted"}
    >
      {returns.length === 0 ? (
        <p className="text-14 text-muted">{copy.crm.returnsEmpty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border-subtle">
          {returns.slice(0, MAX_RETURNS_SHOWN).map((contact) => (
            <li key={contact.id}>
              <button
                type="button"
                onClick={() => onOpen(contact.id)}
                className="focus-ring flex min-h-11 w-full items-center justify-between gap-3 rounded-sm py-1 text-left hovered:underline"
              >
                <span className="min-w-0 truncate font-medium">{contact.label}</span>
                <span
                  className={cn(
                    "type-number shrink-0 text-13",
                    contact.next_action_at! < today ? "text-amber" : "text-muted",
                  )}
                >
                  {contact.next_action_at! < today
                    ? copy.crm.overdue(formatDay(contact.next_action_at!))
                    : copy.crm.today}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {returns.length > MAX_RETURNS_SHOWN && (
        <p className="text-13 text-muted">
          {copy.crm.returnsMore(returns.length - MAX_RETURNS_SHOWN)}
        </p>
      )}
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

export function CrmToday({
  contacts,
  events,
  dailyGoal,
  now,
  today,
  whatsappTemplate,
  onGoalChange,
  onOpen,
  onStatusChange,
}: {
  contacts: Contact[];
  events: ContactEvent[];
  dailyGoal: number;
  now: number;
  today: string;
  whatsappTemplate: string | null;
  onGoalChange: (goal: number) => void;
  onOpen: (id: string) => void;
  onStatusChange: (id: string, status: ContactStatus) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <GoalPanel
        done={contactedToday(events, now)}
        goal={dailyGoal}
        onGoalChange={onGoalChange}
      />
      <QueuePanel
        contacts={contacts}
        whatsappTemplate={whatsappTemplate}
        onOpen={onOpen}
        onStatusChange={onStatusChange}
      />
      <ReturnsPanel returns={dueReturns(contacts, now)} today={today} onOpen={onOpen} />
      <PacePanel pace={dailyPace(events, now)} goal={dailyGoal} />
    </div>
  );
}
