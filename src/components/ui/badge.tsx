import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "neutral" | "accent" | "amber" | "danger" | "outline";

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-surface-raised text-foreground",
  accent: "border border-accent/30 bg-accent-soft text-accent",
  amber: "border border-amber/30 bg-amber-soft text-amber",
  danger: "border border-danger/30 bg-danger-soft text-danger",
  outline: "border border-border text-muted",
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-12 font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
