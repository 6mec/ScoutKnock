import { CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Aviso dentro da página: discreto, com ícone, nunca só pela cor.
export function Callout({
  tone = "info",
  title,
  children,
  role,
  className,
}: {
  tone?: "info" | "amber" | "danger";
  title?: ReactNode;
  children: ReactNode;
  role?: "status" | "alert";
  className?: string;
}) {
  const Icon = tone === "info" ? Info : CircleAlert;

  return (
    <div
      role={role}
      className={cn(
        "flex gap-3 rounded-md border p-3.5 text-14",
        tone === "info" && "border-border bg-surface-raised/60",
        tone === "amber" && "border-amber/30 bg-amber-soft",
        tone === "danger" && "border-danger/30 bg-danger-soft",
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        size={18}
        strokeWidth={1.9}
        className={cn(
          "mt-px shrink-0",
          tone === "info" && "text-muted",
          tone === "amber" && "text-amber",
          tone === "danger" && "text-danger",
        )}
      />
      <div className="flex min-w-0 flex-col gap-1">
        {title && <p className="font-semibold text-foreground">{title}</p>}
        <div className="text-foreground/85">{children}</div>
      </div>
    </div>
  );
}
