"use client";

import NumberFlow from "@number-flow/react";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { scoreLevel } from "@/lib/radar/score";
import type { ScoreLevel } from "@/lib/radar/types";
import { cn } from "@/lib/utils";

const boxes: Record<ScoreLevel, string> = {
  strong: "bg-accent text-accent-contrast",
  medium: "bg-amber text-accent-contrast",
  weak: "border border-border-input text-foreground",
};

const levelText: Record<ScoreLevel, string> = {
  strong: "text-accent",
  medium: "text-amber",
  weak: "text-muted",
};

export function ScoreChip({
  score,
  loading = false,
  error = false,
  className,
}: {
  score?: number;
  loading?: boolean;
  error?: boolean;
  className?: string;
}) {
  if (loading) {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <Skeleton className="h-8 w-10 rounded-sm" />
        <Skeleton className="h-4 w-12" />
      </span>
    );
  }

  if (error || score === undefined) {
    return (
      <span className={cn("inline-flex items-center gap-2 text-danger", className)}>
        <span
          aria-hidden="true"
          className="type-number inline-flex h-8 min-w-10 items-center justify-center rounded-sm border border-danger font-bold"
        >
          –
        </span>
        <span className="text-14">{ptPT.ui.scoreUnavailable}</span>
      </span>
    );
  }

  const level = scoreLevel(score);

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "type-number inline-flex h-8 min-w-10 items-center justify-center rounded-sm px-2 font-bold",
          boxes[level],
        )}
      >
        {/* O número animado lê-se dígito a dígito: o leitor de ecrã recebe o número inteiro. */}
        <span className="sr-only">{score}</span>
        <span aria-hidden="true">
          <NumberFlow value={score} />
        </span>
      </span>
      <span className={cn("type-number text-12", levelText[level])}>
        {ptPT.radar.levels[level]}
      </span>
    </span>
  );
}
