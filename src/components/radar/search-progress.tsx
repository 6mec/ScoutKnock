"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DrawnCheck } from "@/components/ui/drawn-check";
import { ScoreChip } from "@/components/ui/score-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ptPT } from "@/i18n/pt-PT";
import type { ScoredCompany, SearchStep } from "@/lib/radar/search-events";

const { radar: copy } = ptPT;
const STEPS: SearchStep[] = ["reading", "scoring"];
const PLACEHOLDER_ROWS = 3;

export type StepStatus = "waiting" | "active" | "done";

// Os segundos desde o início, para uma espera longa não parecer parada.
function useElapsed(startedAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (startedAt === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);
  return startedAt === null ? null : Math.max(0, Math.floor((now - startedAt) / 1000));
}

export function SearchProgress({
  steps,
  companies,
  onCancel,
  status = null,
  startedAt = null,
}: {
  steps: Record<SearchStep, StepStatus>;
  companies: ScoredCompany[];
  onCancel: () => void;
  // O que está a acontecer agora (servidor, parte, espera), na busca do OpenStreetMap.
  status?: string | null;
  startedAt?: number | null;
}) {
  const active = STEPS.filter((step) => steps[step] === "active").at(-1);
  const elapsed = useElapsed(startedAt);

  return (
    <div className="relative flex flex-col gap-4 overflow-hidden panel panel-glow p-6">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent/60 to-transparent"
      />
      <p className="type-mono text-12 tracking-wide text-muted uppercase">{copy.progressLog}</p>
      <p aria-live="polite" className="sr-only">
        {status ?? (active ? copy.steps[active] : "")}
        {companies.length > 0 && `. ${countLabel(companies.length)}`}
      </p>
      <ol className="flex flex-col gap-3">
        {STEPS.map((step, index) => (
          <li
            key={step}
            data-status={steps[step]}
            className="flex min-h-6 items-center gap-3 data-[status=waiting]:text-muted"
          >
            <span aria-hidden="true" className="type-mono text-12 text-muted">
              [{String(index + 1).padStart(2, "0")}]
            </span>
            <span className="inline-flex size-5 items-center justify-center">
              {steps[step] === "active" && <Spinner className="text-accent" />}
              {steps[step] === "done" && <DrawnCheck />}
            </span>
            {copy.steps[step]}
          </li>
        ))}
      </ol>
      {status && (
        <p data-testid="radar-osm-status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-14">
          <span>{status}</span>
          {elapsed !== null && (
            <span aria-hidden="true" className="type-number text-12 text-muted">
              {copy.osm.elapsed(elapsed)}
            </span>
          )}
        </p>
      )}
      <p className="type-number text-14 text-muted">
        {countLabel(companies.length)}
      </p>
      <ul className="flex flex-col gap-2">
        {companies.map(({ company, opportunity }) => (
          <li key={company.id} className="flex animate-fade-in items-center gap-3">
            <ScoreChip
              score={opportunity.score}
              className="w-24 shrink-0 [&>span:first-child]:min-w-12"
            />
            <span className="min-w-0 truncate">{company.name}</span>
          </li>
        ))}
        {Array.from({ length: Math.max(PLACEHOLDER_ROWS - companies.length, 1) }).map(
          (_, index) => (
            <li key={index} className="flex items-center gap-3">
              <Skeleton className="h-8 w-10" />
              <Skeleton className="h-4 flex-1" />
            </li>
          ),
        )}
      </ul>
      <Button variant="secondary" onClick={onCancel} className="self-start">
        {copy.cancel}
      </Button>
    </div>
  );
}

export function countLabel(count: number) {
  return `${count} ${count === 1 ? copy.countOne : copy.countOther}`;
}
