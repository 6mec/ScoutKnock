import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Título de um bloco: ícone num quadrado com a cor de destaque, título e, se houver,
// uma linha de descrição e uma ação à direita.
export function PanelHeader({
  id,
  icon: Icon,
  title,
  description,
  action,
  tone = "accent",
  as: Heading = "h2",
}: {
  id: string;
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "accent" | "amber" | "info" | "muted";
  as?: "h2" | "h3";
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-md border",
          tone === "accent" && "border-accent/20 bg-accent-soft text-accent",
          tone === "amber" && "border-amber/25 bg-amber-soft text-amber",
          tone === "info" && "border-info/25 bg-info/10 text-info",
          tone === "muted" && "border-border bg-surface-raised text-muted",
        )}
      >
        <Icon size={16} strokeWidth={1.9} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
        <Heading id={id} className="text-14 leading-tight font-semibold text-foreground">
          {title}
        </Heading>
        {description && <p className="text-13 text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
