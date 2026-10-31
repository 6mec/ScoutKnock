import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "type-number inline-flex h-6 min-w-6 items-center justify-center rounded-sm border border-border-strong bg-surface-raised px-1.5 text-12 text-muted",
        className,
      )}
      {...props}
    />
  );
}
