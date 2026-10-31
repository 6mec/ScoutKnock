"use client";

import { Progress as ProgressPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export type ProgressTone = "accent" | "amber" | "muted" | "danger";

const tones: Record<ProgressTone, string> = {
  accent: "bg-accent",
  amber: "bg-amber",
  muted: "bg-muted",
  danger: "bg-danger",
};

// Sem valor, fica no estado de carregamento, com brilho a passar.
export function Progress({
  value,
  tone = "accent",
  label,
  className,
}: {
  value?: number;
  tone?: ProgressTone;
  label: string;
  className?: string;
}) {
  const loading = value === undefined;

  return (
    <ProgressPrimitive.Root
      aria-label={label}
      value={loading ? null : value}
      className={cn(
        "relative h-1.5 overflow-hidden rounded-pill bg-surface-raised",
        className,
      )}
    >
      {loading ? (
        <span className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-foreground/20 to-transparent" />
      ) : (
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full origin-left transition-transform duration-(--duration-base) ease-out",
            tones[tone],
          )}
          style={{ transform: `scaleX(${value / 100})` }}
        />
      )}
    </ProgressPrimitive.Root>
  );
}
