"use client";

import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  CircleAlert,
  CircleCheck,
  Dumbbell,
  Globe,
  History,
  Radar,
  Scissors,
  ShoppingBag,
  Stethoscope,
  UtensilsCrossed,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ptPT } from "@/i18n/pt-PT";
import type { Market } from "@/lib/markets";
import { localitiesFor, resolveLocality } from "@/lib/radar/localities";
import {
  addRecentSearch,
  parseRecentSearches,
  PRE_FILTERS,
  RECENT_SEARCHES_KEY,
  type PreFilter,
} from "@/lib/radar/results";
import { MAX_FILTER_LENGTH } from "@/lib/radar/search-events";
import { SERVICE_IDS, type SearchQuery } from "@/lib/radar/types";
import { useFeatures } from "@/components/app/features";
import { cn } from "@/lib/utils";
import type { SearchUsage } from "./radar-screen";

const { radar: copy } = ptPT;
const RECENT_EVENT = "scoutknock:recentes";
const ALL_NICHES = [
  ...new Set([...ptPT.landing.niches, ...copy.nicheGroups.flatMap(({ niches }) => niches)]),
];
const GROUP_ICONS: Record<(typeof copy.nicheGroups)[number]["id"], LucideIcon> = {
  beleza: Scissors,
  comida: UtensilsCrossed,
  saude: Stethoscope,
  desporto: Dumbbell,
  casa: Wrench,
  comercio: ShoppingBag,
  servicos: Briefcase,
};
// Primeiro as cidades com empresas de exemplo, depois outras capitais de distrito.
const SHORTCUTS = ["Porto", "Lisboa", "Braga", "Coimbra", "Aveiro", "Faro"];

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

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

const chip =
  "focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-border bg-background/40 px-3.5 text-13 text-muted transition-colors duration-(--duration-fast) ease-out hovered:border-accent/40 hovered:text-foreground";
const chipOn = "border-accent/60 bg-accent-soft text-foreground";

function StepLabel({ n, children, extra }: { n: number; children: ReactNode; extra?: ReactNode }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="type-mono inline-flex h-6 min-w-8 items-center justify-center rounded-sm border border-accent/30 bg-accent-soft px-1.5 text-12 text-accent"
      >
        {String(n).padStart(2, "0")}
      </span>
      <span className="text-14 font-semibold">{children}</span>
      {extra}
    </span>
  );
}

export function RadarForm({
  values,
  onChange,
  onSubmit,
  focusOnMount,
  markets,
  usage,
  isAdmin,
  preFilters,
  onPreFiltersChange,
}: {
  markets: Market[];
  values: SearchQuery;
  onChange: (values: SearchQuery) => void;
  onSubmit: () => void;
  focusOnMount: boolean;
  usage: SearchUsage | null;
  isAdmin: boolean;
  preFilters: PreFilter[];
  onPreFiltersChange: (filters: PreFilter[]) => void;
}) {
  const { plans } = useFeatures();
  const nicheRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<string | null>(null);
  const recentRaw = useSyncExternalStore(subscribeRecent, readRecent, () => null);
  const recent = useMemo(() => parseRecentSearches(recentRaw), [recentRaw]);
  const reached = !isAdmin && usage !== null && usage.used >= usage.limit;
  const locality = values.locality.trim() ? resolveLocality(values.locality, markets) : null;
  const group = copy.nicheGroups.find(({ id }) => id === category);

  useEffect(() => {
    if (focusOnMount) nicheRef.current?.focus();
  }, [focusOnMount]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    writeRecent(JSON.stringify(addRecentSearch(recent, values)));
    onSubmit();
  }

  const usageText = isAdmin
    ? copy.usageAdmin
    : usage === null
      ? null
      : reached
        ? copy.usageReached
        : copy.usage(usage.used, usage.limit);

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex flex-col gap-6 overflow-hidden panel panel-glow p-5 sm:p-6"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent/60 to-transparent"
      />
      <p className="type-body text-muted">{copy.empty}</p>

      {recent.length > 0 && (
        <div className="flex flex-col gap-2 rounded-md border border-border-subtle bg-background/40 p-3">
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
              className="focus-ring -my-2 inline-flex size-11 items-center justify-center rounded-md text-muted hovered:text-foreground"
            >
              <X aria-hidden="true" size={16} />
            </button>
          </div>
          <ul
            aria-labelledby="radar-recent"
            aria-describedby="radar-recent-help"
            className="flex flex-wrap gap-1.5"
          >
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
          <p id="radar-recent-help" className="text-12 text-muted">
            {copy.recentHelp}
          </p>
        </div>
      )}

      {/* 01 Serviço: um cartão por serviço, para crescer quando houver mais. */}
      <fieldset className="flex min-w-0 flex-col gap-2.5">
        <legend className="mb-2.5">
          <StepLabel n={1}>{copy.formSteps.service}</StepLabel>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SERVICE_IDS.map((id) => (
            <label
              key={id}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2.5 text-14 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-accent",
                values.service === id && "border-accent/60 bg-accent-soft",
              )}
            >
              <input
                type="radio"
                name="service"
                value={id}
                checked={values.service === id}
                onChange={() => onChange({ ...values, service: id })}
                className="sr-only"
              />
              {id === "online_booking" ? (
                <CalendarClock aria-hidden="true" size={18} className="text-accent" />
              ) : (
                <Globe aria-hidden="true" size={18} className="text-accent" />
              )}
              <span className="font-semibold">{copy.services[id]}</span>
              {values.service === id && (
                <CircleCheck aria-hidden="true" size={16} className="ml-auto text-accent" />
              )}
            </label>
          ))}
        </div>
      </fieldset>

      {/* 02 Nicho: escrever, ou categoria e depois o tipo. */}
      <div className="flex flex-col gap-3">
        <Field label={<StepLabel n={2}>{copy.formSteps.niche}</StepLabel>} help={copy.nicheHelp}>
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
        {group ? (
          <div className="flex flex-col gap-2.5 animate-fade-in">
            <div className="flex flex-wrap items-center gap-2 text-13">
              <button
                type="button"
                onClick={() => setCategory(null)}
                title={copy.changeCategory}
                aria-label={`${group.label}. ${copy.changeCategory}`}
                className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-3 font-semibold text-accent-contrast"
              >
                {(() => {
                  const Icon = GROUP_ICONS[group.id];
                  return <Icon aria-hidden="true" size={16} />;
                })()}
                {group.label}
                <X aria-hidden="true" size={14} className="opacity-80" />
              </button>
              <ArrowRight aria-hidden="true" size={15} className="text-muted" />
              <span id="radar-which-type" className="text-muted">
                {copy.whichType}
              </span>
            </div>
            <ul
              aria-labelledby="radar-which-type"
              className="ml-2 flex flex-wrap gap-1.5 border-l-2 border-accent/40 pl-3"
            >
              {group.niches.map((niche) => {
                const active = sameText(values.niche, niche);
                return (
                  <li key={niche}>
                    <button
                      type="button"
                      data-testid="niche-chip"
                      aria-pressed={active}
                      onClick={() => onChange({ ...values, niche })}
                      className={cn(chip, active && chipOn)}
                    >
                      {niche}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <ul
            aria-label={copy.nicheGroupsLabel}
            className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-4"
          >
            {copy.nicheGroups.map(({ id, label, niches }) => {
              const Icon = GROUP_ICONS[id];
              const holds = niches.some((niche) => sameText(niche, values.niche));
              return (
                <li key={id}>
                  <button
                    type="button"
                    data-testid="niche-group"
                    onClick={() => setCategory(id)}
                    className={cn(
                      "group focus-ring relative flex min-h-14 w-full items-center gap-2.5 overflow-hidden rounded-md border border-border bg-background/40 p-2 text-left transition-colors duration-(--duration-fast) hovered:border-accent/40",
                      holds && "border-accent/50 bg-accent-soft",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-8 shrink-0 place-items-center rounded-sm border border-accent/25 bg-linear-to-br from-accent/25 to-accent/5 text-accent"
                    >
                      <Icon size={16} strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-13 font-semibold">{label}</span>
                      <span className="block text-12 text-muted">
                        {copy.nicheTypes(niches.length)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 03 Localidade: validada antes de gastar a busca. */}
      <div className="flex flex-col gap-2.5">
        <Field label={<StepLabel n={3}>{copy.formSteps.locality}</StepLabel>}>
          <Input
            list="radar-localities"
            value={values.locality}
            onChange={(event) => onChange({ ...values, locality: event.target.value })}
            placeholder={copy.localityPlaceholder}
            maxLength={MAX_FILTER_LENGTH}
            autoComplete="off"
            required
            aria-describedby="radar-locality-status"
          />
        </Field>
        <p
          id="radar-locality-status"
          data-testid="locality-status"
          aria-live="polite"
          className={cn(
            "flex items-start gap-1.5 text-13 empty:hidden",
            locality ? "text-accent" : "text-amber",
          )}
        >
          {values.locality.trim() !== "" &&
            (locality ? (
              <>
                <CircleCheck aria-hidden="true" size={15} className="mt-0.5 shrink-0" />
                {copy.localityFound(locality.name, locality.group)}
              </>
            ) : (
              <>
                <CircleAlert aria-hidden="true" size={15} className="mt-0.5 shrink-0" />
                {copy.localityUnknown}
              </>
            ))}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span id="radar-shortcuts" className="mr-1 text-12 text-muted">
            {copy.localityShortcuts}
          </span>
          {SHORTCUTS.map((name) => (
            <button
              key={name}
              type="button"
              aria-describedby="radar-shortcuts"
              aria-pressed={sameText(values.locality, name)}
              onClick={() => onChange({ ...values, locality: name })}
              className={cn(chip, sameText(values.locality, name) && chipOn)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* 04 Filtros: aplicam-se ao que chega. */}
      <fieldset className="flex min-w-0 flex-col gap-2.5">
        <legend className="mb-2.5">
          <StepLabel
            n={4}
            extra={<span className="text-12 text-muted">({copy.optional})</span>}
          >
            {copy.formSteps.filters}
          </StepLabel>
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {PRE_FILTERS.map((filter) => {
            const on = preFilters.includes(filter);
            return (
              <button
                key={filter}
                type="button"
                data-testid={`pre-${filter}`}
                aria-pressed={on}
                onClick={() =>
                  onPreFiltersChange(
                    on ? preFilters.filter((item) => item !== filter) : [...preFilters, filter],
                  )
                }
                className={cn(chip, "border-dashed", on && cn(chipOn, "border-solid"))}
              >
                {copy.toggles[filter]}
              </button>
            );
          })}
        </div>
        <p className="text-12 text-muted">{copy.filtersHelp}</p>
      </fieldset>

      <datalist id="radar-niches">
        {ALL_NICHES.map((niche) => (
          <option key={niche} value={niche} />
        ))}
      </datalist>
      <datalist id="radar-localities">
        {localitiesFor(markets).map(({ name, group: area }) => (
          <option key={name} value={name} label={area === name ? undefined : area} />
        ))}
      </datalist>

      <div className="flex flex-col gap-3 border-t border-border-subtle pt-5">
        <div data-testid="radar-query" className="rounded-md border border-border-subtle bg-background/60 px-3 py-2.5">
          <p className="type-mono text-12 tracking-wide text-muted uppercase">{copy.queryLabel}</p>
          <p className="type-mono mt-1 text-13 break-words text-foreground">
            {values.niche.trim() && values.locality.trim() ? (
              <>
                <span className="text-accent">&gt;</span> {copy.services[values.service].toLowerCase()}
                {" / "}
                {values.niche.trim().toLowerCase()}
                {" / "}
                {(locality?.name ?? values.locality.trim()).toLowerCase()}
                {preFilters.map((filter) => (
                  <span key={filter} className="text-muted">
                    {" "}+{copy.toggles[filter].toLowerCase()}
                  </span>
                ))}
              </>
            ) : (
              <span className="text-muted">{copy.queryEmpty}</span>
            )}
          </p>
        </div>
        <Button type="submit" size="lg" className="w-full">
          <Radar aria-hidden="true" size={18} />
          {copy.submit}
        </Button>
        {usageText && (
          <p
            data-testid="radar-usage"
            className={cn("type-number text-13", reached ? "text-amber" : "text-muted")}
          >
            {usageText}{" "}
            {!isAdmin && plans && (
              <Link href="/painel/planos" className="focus-ring rounded-sm text-accent underline">
                {copy.seePlans}
              </Link>
            )}
          </p>
        )}
      </div>
    </form>
  );
}
