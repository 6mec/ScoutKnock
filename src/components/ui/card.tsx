import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const interactiveClasses =
  "focus-ring transition-[transform,background-color,border-color] duration-(--duration-fast) ease-out motion-safe:hovered:-translate-y-0.5 hovered:border-accent hovered:bg-surface-raised motion-safe:pressed:scale-[.99]";

export function Card({
  interactive = false,
  error = false,
  disabled = false,
  asChild = false,
  className,
  ...props
}: ComponentProps<"div"> & {
  interactive?: boolean;
  error?: boolean;
  disabled?: boolean;
  asChild?: boolean;
}) {
  const Component = asChild ? Slot.Root : "div";

  return (
    <Component
      aria-disabled={disabled || undefined}
      className={cn(
        "panel block rounded-md p-4",
        interactive && interactiveClasses,
        error && "border-danger",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Panel({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "panel p-6",
        className,
      )}
      {...props}
    />
  );
}
