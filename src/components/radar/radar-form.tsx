"use client";

import { History, X } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { ptPT } from "@/i18n/pt-PT";
import type { Market } from "@/lib/markets";
import { localitiesFor } from "@/lib/radar/localities";
import {
  addRecentSearch,
  parseRecentSearches,
  RECENT_SEARCHES_KEY,
} from "@/lib/radar/results";
import { MAX_FILTER_LENGTH } from "@/lib/radar/search-events";
import { SERVICE_IDS, type SearchQuery, type ServiceId } from "@/lib/radar/types";
import { cn } from "@/lib/utils";
import type { SearchUsage } from "./radar-screen";

const { radar: copy } = ptPT;
const RECENT_EVENT = "scoutknock:recentes";
const ALL_NICHES = [
  ...new Set([...ptPT.landing.niches, ...copy.nicheGroups.flatMap(({ niches }) => niches)]),
];

// O browser pode recusar o armazenamento (janela privada, dados bloqueados): nesse
// caso, simplesmente não há buscas recentes.
function readRecent() {
  try {
    return window.localStorage.getItem(RECENT_SEARCHES_KEY);
  } catch {
    return null;
  }
}

function writeRecent(value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    else window.localStorage.setItem(RECENT_SEARCHES_KEY, value);
  } catch {
    // Sem armazenamento, a lista fica vazia.
  }
  window.dispatchEvent(new Event(RECENT_EVENT));
}

function subscribeRecent(onChange: () => void) {
  window.addEventListener(RECENT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(RECENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const chip =
  "focus-ring inline-flex min-h-11 items-center rounded-md border border-border px-3 text-14 text-muted transition-colors duration-(--duration-fast) ease-out hovered:border-border-input hovered:text-foreground";

export function RadarForm({
  values,
  onChange,
  onSubmit,
  focusOnMount,
  markets,
  usage,
  isAdmin,
}: {
  markets: Market[];
  values: SearchQuery;
  onChange: (values: SearchQuery) => void;
  onSubmit: () => void;
  focusOnMount: boolean;
  usage: SearchUsage | null;
  isAdmin: boolean;
}) {
  const nicheRef = useRef<HTMLInputElement>(null);
  const [group, setGroup] = useState(0);
  const recentRaw = useSyncExternalStore(subscribeRecent, readRecent, () => null);
  const recent = useMemo(() => parseRecentSearches(recentRaw), [recentRaw]);
  const reached = !isAdmin && usage !== null && usage.used >= usage.limit;

  useEffect(() => {
    if (focusOnMount) nicheRef.current?.focus();
  }, [focusOnMount]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    writeRecent(JSON.stringify(addRecentSearch(recent, values)));
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 panel p-6"
    >
      <p className="type-body text-muted">{copy.empty}</p>
      {recent.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p id="radar-recent" className="flex items-center gap-1.5 text-13 font-semibold text-muted">
              <History aria-hidden="true" size={15} strokeWidth={1.9} />
              {copy.recentLabel}
            </p>
            <button
              type="button"
              onClick={() => writeRecent(null)}
              aria-label={copy.recentClear}
              title={copy.recentClear}
              className="focus-ring inline-flex size-11 items-center justify-center rounded-md text-muted hovered:text-foreground"
            >
              <X aria-hidden="true" size={16} />
            </button>
          </div>
          <ul aria-labelledby="radar-recent" aria-describedby="radar-recent-help" className="flex flex-wrap gap-1.5">
            {recent.map((item) => (
              <li key={`${item.niche}|${item.locality}`}>
                <button
                  type="button"
                  data-testid="recent-search"
                  onClick={() => onChange({ ...values, ...item })}
                  className={chip}
                >
                  {item.niche} · {item.locality}
                </button>
              </li>
            ))}
          </ul>
          <p id="radar-recent-help" className="text-13 text-muted">
            {copy.recentHelp}
          </p>
        </div>
      )}
      <Field label={copy.serviceLabel}>
        <Select
          value={values.service}
          onChange={(event) =>
            onChange({ ...values, service: event.target.value as ServiceId })
          }
        >
          {SERVICE_IDS.map((id) => (
            <option key={id} value={id}>
              {copy.services[id]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={copy.nicheLabel}>
        <Input
          ref={nicheRef}
          list="radar-niches"
          value={values.niche}
          onChange={(event) => onChange({ ...values, niche: event.target.value })}
          placeholder={copy.nichePlaceholder}
          maxLength={MAX_FILTER_LENGTH}
          autoComplete="off"
          required
        />
      </Field>
      <fieldset className="-mt-1 flex min-w-0 flex-col gap-2">
        <legend className="mb-2 text-13 font-semibold text-muted">
          {copy.nicheGroupsLabel}
        </legend>
        <div className="flex flex-wrap gap-1">
          {copy.nicheGroups.map(({ label }, index) => (
            <button
              key={label}
              type="button"
              aria-pressed={group === index}
              onClick={() => setGroup(index)}
              className={cn(
                "focus-ring inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-13 font-semibold text-muted transition-colors duration-(--duration-fast) hovered:text-foreground",
                group === index && "bg-surface-raised text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <ul className="flex flex-wrap gap-1.5">
          {copy.nicheGroups[group].niches.map((niche) => {
            const active = values.niche.trim().toLowerCase() === niche.toLowerCase();

            return (
              <li key={niche}>
                <button
                  type="button"
                  data-testid="niche-chip"
                  aria-pressed={active}
                  onClick={() => onChange({ ...values, niche })}
                  className={cn(
                    chip,
                    active && "border-accent/50 bg-accent-soft text-foreground",
                  )}
                >
                  {niche}
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>
      <Field label={copy.localityLabel}>
        <Input
          list="radar-localities"
          value={values.locality}
          onChange={(event) =>
            onChange({ ...values, locality: event.target.value })
          }
          placeholder={copy.localityPlaceholder}
          maxLength={MAX_FILTER_LENGTH}
          autoComplete="off"
          required
        />
      </Field>
      <datalist id="radar-niches">
        {ALL_NICHES.map((niche) => (
          <option key={niche} value={niche} />
        ))}
      </datalist>
      <datalist id="radar-localities">
        {localitiesFor(markets).map(({ name, group }) => (
          <option key={name} value={name} label={group === name ? undefined : group} />
        ))}
      </datalist>
      <Button type="submit" size="lg" className="w-full">
        {copy.submit}
      </Button>
      {(isAdmin || usage) && (
        <p
          data-testid="radar-usage"
          className={cn("type-number text-13", reached ? "text-amber" : "text-muted")}
        >
          {isAdmin
            ? copy.usageAdmin
            : reached
              ? copy.usageReached
              : copy.usage(usage!.used, usage!.limit)}{" "}
          {!isAdmin && (
            <Link
              href="/painel/planos"
              className="focus-ring rounded-sm text-accent underline"
            >
              {copy.seePlans}
            </Link>
          )}
        </p>
      )}
    </form>
  );
}
