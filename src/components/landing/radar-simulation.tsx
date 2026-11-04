"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress, type ProgressTone } from "@/components/ui/progress";
import { ScoreChip } from "@/components/ui/score-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import {
  SIMULATION_NICHES,
  type SimulationNicheId,
} from "@/lib/radar/landing-examples";
import { scoreCompany } from "@/lib/radar/score";
import type { ScoreLevel } from "@/lib/radar/types";
import { cn } from "@/lib/utils";

const { example } = ptPT.landing;
const { radar } = ptPT;

// A procura é só encenação: uma volta do feixe, sem nenhum pedido à rede.
const SEARCH_MS = 1600;
const CENTER = 120;

const scoreColors: Record<ScoreLevel, string> = {
  strong: "text-accent",
  medium: "text-amber",
  weak: "text-muted",
};
const blipFills: Record<ScoreLevel, string> = {
  strong: "var(--accent)",
  medium: "var(--amber)",
  weak: "var(--muted)",
};
const tones: Record<ScoreLevel, ProgressTone> = {
  strong: "accent",
  medium: "amber",
  weak: "muted",
};
const BLIP_POSITIONS = [
  { x: 168, y: 70 },
  { x: 70, y: 150 },
  { x: 150, y: 186 },
];

function resultsFor(nicheId: SimulationNicheId) {
  const niche = SIMULATION_NICHES.find((item) => item.id === nicheId)!;
  return niche.companies
    .map((company) => ({
      company,
      opportunity: scoreCompany(company, "website_creation"),
    }))
    .sort((a, b) => b.opportunity.score - a.opportunity.score);
}

function sweepDelay(x: number, y: number) {
  const degrees = (Math.atan2(x - CENTER, CENTER - y) * 180) / Math.PI;
  return `${(((degrees + 360) % 360) / 360) * SEARCH_MS}ms`;
}

export function RadarSimulation() {
  const reduced = useReducedMotion();
  const [nicheId, setNicheId] = useState<SimulationNicheId>("pastelarias");
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function search(next: SimulationNicheId) {
    clearTimeout(timer.current);
    setNicheId(next);
    setSelected(0);
    if (reduced) return;
    setSearching(true);
    timer.current = setTimeout(() => setSearching(false), SEARCH_MS);
  }

  const results = resultsFor(nicheId);
  const current = results[selected];
  const { company, opportunity } = current;
  const label = example.niches[nicheId];

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div
            role="group"
            aria-label={example.nicheLabel}
            className="flex flex-wrap gap-2"
          >
            {SIMULATION_NICHES.map(({ id }) => (
              <button
                key={id}
                type="button"
                aria-pressed={id === nicheId}
                onClick={() => search(id)}
                className={cn(
                  "focus-ring min-h-11 cursor-pointer rounded-sm border px-3.5 text-14 font-medium transition-colors duration-(--duration-fast)",
                  id === nicheId
                    ? "border-accent bg-accent text-accent-contrast"
                    : "border-border-input bg-background hovered:border-accent",
                )}
              >
                {example.niches[id]}
              </button>
            ))}
          </div>
          <Badge variant="amber">{example.badge}</Badge>
        </div>

        <div className="grid lg:grid-cols-[300px_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col items-center justify-center gap-3 border-b border-border p-5 lg:border-r lg:border-b-0">
            <svg
              viewBox="0 0 240 240"
              aria-hidden="true"
              className="size-28 lg:size-55"
            >
              <g fill="none" stroke="var(--border)">
                <circle cx={CENTER} cy={CENTER} r="40" />
                <circle cx={CENTER} cy={CENTER} r="80" />
                <circle cx={CENTER} cy={CENTER} r="118" />
                <path d="M120 2V238M2 120H238" />
              </g>
              {searching && (
                <g
                  className="animate-radar-sweep"
                  style={{
                    transformOrigin: "120px 120px",
                    animationDuration: `${SEARCH_MS}ms`,
                  }}
                >
                  <path
                    d="M120 120L36.6 36.6A118 118 0 0 1 120 2Z"
                    fill="var(--accent)"
                    fillOpacity=".14"
                  />
                  <path d="M120 120L120 2" stroke="var(--accent)" strokeWidth="1.6" />
                </g>
              )}
              {results.map((result, index) => {
                const { x, y } = BLIP_POSITIONS[index];
                return (
                  <circle
                    key={result.company.id}
                    cx={x}
                    cy={y}
                    r={index === selected && !searching ? 7 : 5}
                    fill={blipFills[result.opportunity.level]}
                    className={searching ? "animate-sim-blip" : undefined}
                    style={
                      searching
                        ? { animationDelay: sweepDelay(x, y) }
                        : undefined
                    }
                  />
                );
              })}
              <circle cx={CENTER} cy={CENTER} r="3" fill="var(--foreground)" />
            </svg>
            <p
              role="status"
              className="type-mono min-h-5 text-center text-13 text-muted"
            >
              {searching
                ? example.searching(label)
                : example.found(results.length, company.locality)}
            </p>
          </div>

          <ul className="flex flex-col border-b border-border lg:border-r lg:border-b-0">
            {results.map((result, index) => (
              <li
                key={result.company.id}
                className="flex-1 border-b border-border last:border-b-0"
              >
                {searching ? (
                  <div className="flex h-full min-h-26 items-center gap-3 px-4 py-3">
                    <Skeleton className="h-8 w-10 shrink-0 rounded-sm" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-pressed={index === selected}
                    onClick={() => setSelected(index)}
                    className={cn(
                      "focus-ring flex h-full min-h-26 w-full cursor-pointer flex-col items-start justify-center gap-1.5 px-4 py-3 text-left transition-colors duration-(--duration-fast)",
                      index === selected
                        ? "bg-background shadow-[inset_3px_0_0_var(--accent)]"
                        : "hovered:bg-background",
                    )}
                  >
                    <span className="font-semibold">{result.company.name}</span>
                    <ScoreChip score={result.opportunity.score} />
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="flex min-h-96 lg:min-h-84 flex-col gap-4 p-5 lg:p-6">
            {searching ? (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-16 w-24" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <>
                <h3 className="type-heading text-20">{company.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "type-mono text-64 leading-none font-semibold",
                      scoreColors[opportunity.level],
                    )}
                  >
                    {opportunity.score}
                  </span>
                  <span className="type-mono text-13 text-muted">
                    {example.scoreSuffix} · {radar.levels[opportunity.level]}
                  </span>
                </div>
                <Progress
                  value={opportunity.score}
                  tone={tones[opportunity.level]}
                  label={example.scoreLabel}
                  className="h-2"
                />
                {opportunity.reasons.length > 0 ? (
                  <ul className="flex flex-col">
                    {opportunity.reasons.map((reason) => (
                      <li
                        key={reason.code}
                        className="flex justify-between gap-4 border-t border-border py-2.5"
                      >
                        <span>{radar.reasons[reason.code]}</span>
                        <span className="type-mono shrink-0 text-accent">
                          +{reason.points}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">{radar.noReasons}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <p className="px-1 text-13 text-muted">{example.note}</p>
    </div>
  );
}
