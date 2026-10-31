"use client";

import NumberFlow from "@number-flow/react";
import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress, type ProgressTone } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ptPT } from "@/i18n/pt-PT";
import { LANDING_EXAMPLE } from "@/lib/radar/landing-examples";
import { scoreCompany } from "@/lib/radar/score";
import type { Company, ReasonCode, ScoreLevel } from "@/lib/radar/types";
import { cn } from "@/lib/utils";

const { example } = ptPT.landing;
const { levels } = ptPT.radar;

const FEW_REVIEWS_EXAMPLE = LANDING_EXAMPLE.reviewCount;
const MANY_REVIEWS_EXAMPLE = 120;

const scoreColors: Record<ScoreLevel, string> = {
  strong: "text-accent",
  medium: "text-amber",
  weak: "text-muted",
};
const tones: Record<ScoreLevel, ProgressTone> = {
  strong: "accent",
  medium: "amber",
  weak: "muted",
};

function ToggleRow({
  label,
  value,
  points,
  checked,
  onChange,
}: {
  label: string;
  value: string;
  points?: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();

  return (
    <div className="flex items-center justify-between gap-4 border-t border-border py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer">
          {label}
        </label>
        <p className="text-14 text-muted">
          {value}
          {points !== undefined && (
            <span className="type-number text-accent"> +{points}</span>
          )}
        </p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function ScoreDemo() {
  const [hasSite, setHasSite] = useState(LANDING_EXAMPLE.website !== null);
  const [manyReviews, setManyReviews] = useState(false);
  const [hasHours, setHasHours] = useState(LANDING_EXAMPLE.hasOpeningHours);

  const company: Company = {
    ...LANDING_EXAMPLE,
    website: hasSite ? "https://exemplo.example" : null,
    reviewCount: manyReviews ? MANY_REVIEWS_EXAMPLE : FEW_REVIEWS_EXAMPLE,
    hasOpeningHours: hasHours,
  };
  const opportunity = scoreCompany(company, "website_creation");
  const pointsFor = (code: ReasonCode) =>
    opportunity.reasons.find((reason) => reason.code === code)?.points;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col items-start gap-3">
            <Badge variant="amber">{example.badge}</Badge>
            <h3 className="type-heading text-24">{example.company}</h3>
          </div>
          <div className="text-right" aria-live="polite">
            <div
              className={cn(
                "type-number text-64 leading-none font-semibold",
                scoreColors[opportunity.level],
              )}
            >
              <NumberFlow value={opportunity.score} />
            </div>
            <p className="type-number text-13 text-muted">
              {example.scoreSuffix} · {levels[opportunity.level]}
            </p>
          </div>
        </div>
        <Progress
          value={opportunity.score}
          tone={tones[opportunity.level]}
          label={example.scoreLabel}
          className="h-2"
        />
        <div className="flex flex-col">
          <ToggleRow
            label={example.toggles.site.label}
            value={
              hasSite ? example.toggles.site.on : example.toggles.site.off
            }
            points={pointsFor("noWebsite")}
            checked={hasSite}
            onChange={setHasSite}
          />
          <ToggleRow
            label={example.toggles.reviews.label}
            value={
              manyReviews
                ? example.toggles.reviews.on
                : example.toggles.reviews.off
            }
            points={pointsFor("fewReviews")}
            checked={manyReviews}
            onChange={setManyReviews}
          />
          <ToggleRow
            label={example.toggles.hours.label}
            value={
              hasHours ? example.toggles.hours.on : example.toggles.hours.off
            }
            points={pointsFor("noOpeningHours")}
            checked={hasHours}
            onChange={setHasHours}
          />
          <div className="flex justify-between gap-4 border-t border-border py-3">
            <span className="text-muted">{example.localPresence.label}</span>
            <span className="text-right">{example.localPresence.value}</span>
          </div>
        </div>
        {!hasSite && (
          <p className="rounded-md border border-border bg-background px-4 py-3">
            <span className="font-semibold text-amber">
              {example.suggestionLabel} ·{" "}
            </span>
            {example.suggestion}
          </p>
        )}
      </div>
      <p className="px-1 text-13 text-muted">{example.note}</p>
    </div>
  );
}
