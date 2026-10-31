import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-sm bg-surface-raised",
        "after:absolute after:inset-0 after:animate-shimmer after:bg-linear-to-r after:from-transparent after:via-foreground/8 after:to-transparent after:content-['']",
        className,
      )}
      {...props}
    />
  );
}
