"use client";

import { ChevronDown, Calculator } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Field, Input } from "@/components/ui/field";
import { PanelHeader } from "@/components/ui/panel-header";
import { ptPT } from "@/i18n/pt-PT";
import type { Contact } from "@/lib/contacts/rules";
import {
  averageWonValue,
  closeRate,
  parsePlannerInput,
  planMonth,
  PLANNER_KEY,
  type PlannerInput,
} from "@/lib/outreach/rules";
import { cn } from "@/lib/utils";

const { outreach: copy } = ptPT;
const PLANNER_EVENT = "scoutknock:planeador";
const money = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

// Só neste browser: o planeador é uma conveniência e não precisa de ir para a base de dados.
function read() {
  try {
    return window.localStorage.getItem(PLANNER_KEY);
  } catch {
    return null;
  }
}

function write(value: PlannerInput) {
  try {
    window.localStorage.setItem(PLANNER_KEY, JSON.stringify(value));
  } catch {
    // Sem armazenamento, os números valem só até sair da página.
  }
  window.dispatchEvent(new Event(PLANNER_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(PLANNER_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(PLANNER_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const toNumber = (value: string) => {
  const parsed = Number(value.replace(",", "."));
  return value.trim() === "" || !Number.isFinite(parsed) ? null : parsed;
};

export function PlannerPanel({ contacts }: { contacts: Contact[] }) {
  const [open, setOpen] = useState(false);
  const stored = parsePlannerInput(useSyncExternalStore(subscribe, read, () => null));
  // Sem armazenamento, guarda-se aqui o que se escreve.
  const [local, setLocal] = useState<PlannerInput | null>(null);
  const input = local ?? stored;
  const rate = useMemo(() => closeRate(contacts.map(({ status }) => status)), [contacts]);
  const average = useMemo(
    () => averageWonValue(contacts.map(({ status, deal_value }) => ({ status, deal_value }))),
    [contacts],
  );
  const effective = {
    goal: input.goal,
    price: input.price ?? average,
    ratePercent: input.ratePercent ?? rate?.percent ?? null,
  };
  const plan = planMonth(effective);

  function update(patch: Partial<PlannerInput>) {
    const next = { ...input, ...patch };
    setLocal(next);
    write(next);
  }

  return (
    <section aria-labelledby="crm-planner" data-testid="crm-planner" className="panel flex flex-col gap-3 p-4">
      <PanelHeader
        id="crm-planner"
        icon={Calculator}
        tone="info"
        title={copy.planner.title}
        description={copy.planner.intro}
        action={
          <button
            type="button"
            aria-expanded={open}
            aria-controls="planner-body"
            onClick={() => setOpen(!open)}
            data-testid="planner-toggle"
            className="focus-ring inline-flex size-11 items-center justify-center rounded-md text-muted hovered:text-foreground"
          >
            <span className="sr-only">{copy.planner.title}</span>
            <ChevronDown aria-hidden="true" size={18} className={cn("transition-transform", open && "rotate-180")} />
          </button>
        }
      />
      {open && (
        <div id="planner-body" className="grid animate-fade-in gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={copy.planner.goal}>
              <Input
                inputMode="numeric"
                data-testid="planner-goal"
                value={input.goal ?? ""}
                onChange={(event) => update({ goal: toNumber(event.target.value) })}
              />
            </Field>
            <Field
              label={copy.planner.price}
              help={average !== null ? copy.planner.priceHint(money.format(average)) : undefined}
            >
              <Input
                inputMode="numeric"
                data-testid="planner-price"
                value={input.price ?? ""}
                placeholder={average !== null ? String(average) : undefined}
                onChange={(event) => update({ price: toNumber(event.target.value) })}
              />
            </Field>
            <Field
              label={copy.planner.rate}
              help={
                rate
                  ? copy.planner.rateFromData(rate.won, rate.decided, rate.percent)
                  : copy.planner.rateNoData
              }
            >
              <Input
                inputMode="numeric"
                data-testid="planner-rate"
                value={input.ratePercent ?? ""}
                placeholder={rate ? String(rate.percent) : undefined}
                onChange={(event) => update({ ratePercent: toNumber(event.target.value) })}
              />
            </Field>
          </div>
          <div
            role="status"
            data-testid="planner-result"
            className="flex flex-col justify-center gap-2 rounded-md border border-border-subtle bg-background/50 p-4"
          >
            {plan ? (
              <>
                <p className="type-mono text-12 tracking-wide text-muted uppercase">{copy.planner.result}</p>
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="type-heading text-24">{copy.planner.sales(plan.sales)}</span>
                  {plan.contacts !== null && (
                    <span className="text-15 text-muted">
                      · {copy.planner.contacts(plan.contacts)} · {copy.planner.perDay(plan.perDay ?? 0)}
                    </span>
                  )}
                </p>
              </>
            ) : (
              <p className="text-14 text-muted">{copy.planner.empty}</p>
            )}
            <p className="text-12 text-muted">{copy.planner.note}</p>
          </div>
        </div>
      )}
    </section>
  );
}
