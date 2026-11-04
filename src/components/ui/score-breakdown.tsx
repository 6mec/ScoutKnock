"use client";

import { Progress, type ProgressTone } from "@/components/ui/progress";
import { ScoreChip } from "@/components/ui/score-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import type { Opportunity, ScoreLevel, SiteObservation } from "@/lib/radar/types";
import { cn } from "@/lib/utils";

const { radar: copy } = ptPT;
const secondsFormat = new Intl.NumberFormat("pt-PT", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function observationText(observed: SiteObservation) {
  const { observations } = copy;
  switch (observed.kind) {
    case "responseTime":
      return observations.responseTime(secondsFormat.format(observed.ms / 1000));
    case "noViewport":
      return observations.noViewport;
    case "copyright":
      return observations.copyright(observed.year);
    case "legacyTech":
      return observations.legacyTech[observed.tech];
    case "noHttps":
      return observations.noHttps;
    case "thirdParty":
      return observations.thirdParty[observed.thirdParty];
  }
}

const tones: Record<ScoreLevel, ProgressTone> = {
  strong: "accent",
  medium: "amber",
  weak: "muted",
};

// Os pontos vêm sempre do resultado de scoreCompany.
export function ScoreBreakdown({
  opportunity,
  loading = false,
  className,
}: {
  opportunity?: Opportunity;
  loading?: boolean;
  className?: string;
}) {
  if (loading || !opportunity) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <ScoreChip loading />
        <Skeleton className="h-1.5 w-full rounded-pill" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <ScoreChip score={opportunity.score} />
      <Progress
        value={opportunity.score}
        tone={tones[opportunity.level]}
        label={copy.scoreLabel}
      />
      <h3 className="text-14 font-bold">{copy.reasonsLabel}</h3>
      {opportunity.reasons.length === 0 ? (
        <p className="text-14 text-muted">{copy.noReasons}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {opportunity.reasons.map((reason) => (
            <li key={reason.code} className="flex justify-between gap-4 text-14">
              <span>
                {copy.reasons[reason.code]}
                {reason.observed && (
                  <span className="block text-13 text-muted">
                    {observationText(reason.observed)}
                  </span>
                )}
              </span>
              <span className="type-number text-muted">+{reason.points}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
