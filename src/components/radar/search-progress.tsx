"use client";

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

export function SearchProgress({
  steps,
  companies,
  onCancel,
}: {
  steps: Record<SearchStep, StepStatus>;
  companies: ScoredCompany[];
  onCancel: () => void;
}) {
  const active = STEPS.filter((step) => steps[step] === "active").at(-1);

  return (
    <div className="flex flex-col gap-4 panel p-6">
      <p aria-live="polite" className="sr-only">
        {active ? copy.steps[active] : ""}
        {companies.length > 0 && `. ${countLabel(companies.length)}`}
      </p>
      <ol className="flex flex-col gap-3">
        {STEPS.map((step) => (
          <li
            key={step}
            data-status={steps[step]}
            className="flex min-h-6 items-center gap-3 data-[status=waiting]:text-muted"
          >
            <span className="inline-flex size-5 items-center justify-center">
              {steps[step] === "active" && <Spinner className="text-accent" />}
              {steps[step] === "done" && <DrawnCheck />}
            </span>
            {copy.steps[step]}
          </li>
        ))}
      </ol>
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
