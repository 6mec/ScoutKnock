import { Slot } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent font-semibold text-accent-contrast shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_1px_2px_rgb(0_0_0/0.18)] hovered:shadow-halo motion-safe:hovered:-translate-y-px",
  secondary:
    "border border-border bg-surface-raised/50 text-foreground shadow-[inset_0_1px_0_var(--panel-highlight)] hovered:border-border-strong hovered:bg-surface-raised",
  ghost: "bg-transparent text-muted hovered:bg-surface-raised hovered:text-foreground",
  danger: "bg-danger font-semibold text-accent-contrast hovered:opacity-90",
};

const sizes: Record<ButtonSize, string> = {
  // À vista 32, 40 e 44 px; a área de toque tem sempre pelo menos 44 px.
  sm: "h-8 gap-1.5 px-2.5 text-13 before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-['']",
  md: "h-10 px-4 text-14 before:absolute before:inset-x-0 before:-inset-y-0.5 before:content-['']",
  lg: "h-11 px-5 text-15",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  error = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  error?: boolean;
  className?: string;
} = {}) {
  return cn(
    "focus-ring relative inline-flex select-none items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap",
    "transition-[transform,box-shadow,background-color,border-color,opacity] duration-(--duration-fast) ease-out",
    "motion-safe:pressed:scale-[.98] disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    error && "ring-2 ring-danger ring-offset-2 ring-offset-background",
    className,
  );
}

type Props = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: ReactNode;
  error?: boolean;
  asChild?: boolean;
};

export function Button({
  variant,
  size,
  loading = false,
  loadingText,
  error = false,
  asChild = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: Props) {
  const classes = buttonClasses({ variant, size, error, className });

  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...props}
    >
      {/* Os dois textos ocupam a mesma célula, para a largura não mudar. */}
      <span className="grid place-items-center">
        <span
          className={cn(
            "col-start-1 row-start-1 inline-flex items-center gap-2",
            loading && "invisible",
          )}
        >
          {children}
        </span>
        <span
          className={cn(
            "col-start-1 row-start-1 inline-flex items-center gap-2",
            !loading && "invisible",
          )}
        >
          <Spinner />
          {loadingText}
        </span>
      </span>
    </button>
  );
}
