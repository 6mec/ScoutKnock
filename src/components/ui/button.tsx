import { Slot } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-contrast hovered:shadow-halo motion-safe:hovered:-translate-y-px",
  secondary:
    "border border-border-strong bg-transparent text-foreground hovered:border-border-input hovered:bg-surface-raised",
  ghost: "bg-transparent text-foreground hovered:bg-surface-raised",
  danger: "bg-danger text-accent-contrast hovered:opacity-90",
};

const sizes: Record<ButtonSize, string> = {
  // 36 px à vista, com área de toque de 44 px.
  sm: "h-9 px-3 text-14 before:absolute before:-inset-x-0 before:-inset-y-1 before:content-['']",
  md: "h-11 px-4 text-16",
  lg: "h-13 px-6 text-16",
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
    "focus-ring relative inline-flex select-none items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap",
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
