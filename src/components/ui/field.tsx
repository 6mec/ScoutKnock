"use client";

import { ChevronDown, CircleAlert, Eye, EyeOff } from "lucide-react";
import { Label as LabelPrimitive } from "radix-ui";
import {
  createContext,
  use,
  useId,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type FieldContextValue = {
  id: string;
  describedBy?: string;
  invalid: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

function useControlProps(id?: string) {
  const field = use(FieldContext);

  return {
    id: id ?? field?.id,
    "aria-describedby": field?.describedBy,
    "aria-invalid": field?.invalid || undefined,
    invalid: field?.invalid ?? false,
  };
}

export function Field({
  label,
  help,
  error,
  className,
  children,
}: {
  label: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy =
    [help ? helpId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <FieldContext value={{ id, describedBy, invalid: Boolean(error) }}>
      <div className={cn("flex flex-col gap-2", className)}>
        <LabelPrimitive.Root htmlFor={id} className="text-13 text-muted">
          {label}
        </LabelPrimitive.Root>
        {children}
        {help && (
          <p id={helpId} className="text-14 text-muted">
            {help}
          </p>
        )}
        <div aria-live="polite">
          {error && (
            <p
              id={errorId}
              className="flex items-start gap-2 text-14 text-danger"
            >
              <CircleAlert
                aria-hidden="true"
                size={16}
                strokeWidth={1.75}
                className="mt-0.5 shrink-0"
              />
              {error}
            </p>
          )}
        </div>
      </div>
    </FieldContext>
  );
}

function controlClasses(invalid: boolean, className?: string) {
  return cn(
    "focus-ring w-full rounded-md border border-border-input bg-surface text-16 text-foreground placeholder:text-muted",
    "transition-colors duration-(--duration-fast) ease-out hovered:border-muted",
    "disabled:cursor-not-allowed disabled:opacity-50",
    invalid && "border-danger hovered:border-danger",
    className,
  );
}

export function Input({
  id,
  loading = false,
  className,
  ...props
}: ComponentProps<"input"> & { loading?: boolean }) {
  const { invalid, ...control } = useControlProps(id);

  return (
    <div className="relative">
      <input
        {...control}
        aria-busy={loading || undefined}
        readOnly={loading || props.readOnly}
        className={controlClasses(invalid, cn("h-12 px-3", loading && "pr-10", className))}
        {...props}
      />
      {loading && (
        <Spinner className="absolute top-4 right-3 text-muted" />
      )}
    </div>
  );
}

export function PasswordInput({
  showLabel,
  hideLabel,
  className,
  ...props
}: Omit<ComponentProps<typeof Input>, "type"> & {
  showLabel: string;
  hideLabel: string;
}) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-12", className)}
        {...props}
      />
      <button
        type="button"
        aria-label={visible ? hideLabel : showLabel}
        onClick={() => setVisible((current) => !current)}
        className="focus-ring absolute top-0.5 right-0.5 inline-flex size-11 items-center justify-center rounded-md text-muted transition-colors duration-(--duration-fast) ease-out hovered:text-foreground"
      >
        <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
      </button>
    </div>
  );
}

export function Select({
  id,
  className,
  children,
  ...props
}: ComponentProps<"select">) {
  const { invalid, ...control } = useControlProps(id);

  return (
    <div className="relative">
      <select
        {...control}
        className={controlClasses(
          invalid,
          cn("h-12 appearance-none pr-10 pl-3", className),
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        size={16}
        strokeWidth={1.75}
        className="pointer-events-none absolute top-4 right-3 text-muted"
      />
    </div>
  );
}

export function Textarea({
  id,
  className,
  ...props
}: ComponentProps<"textarea">) {
  const { invalid, ...control } = useControlProps(id);

  return (
    <textarea
      {...control}
      className={controlClasses(
        invalid,
        cn("min-h-28 px-3 py-3 leading-[1.6]", className),
      )}
      {...props}
    />
  );
}
