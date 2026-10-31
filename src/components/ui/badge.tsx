import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "neutral" | "accent" | "amber" | "danger" | "outline";

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-surface-raised text-foreground",
  accent: "border border-accent text-accent",
  amber: "border border-amber text-amber",
  danger: "border border-danger text-danger",
  outline: "border border-border-strong text-muted",
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-13 font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
