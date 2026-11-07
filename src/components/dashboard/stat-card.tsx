import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Cartão de um número grande do Início. Sem dados, `value` é null e mostra só o texto do
// estado vazio (nunca um zero que pareça um resultado).
export function StatCard({
  id,
  label,
  icon: Icon,
  value,
  detail,
  empty,
  tone,
  href,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string | null;
  detail?: ReactNode;
  empty?: ReactNode;
  tone?: "danger";
  href?: string;
}) {
  const body = (
    <>
      <span className="flex items-center gap-2 text-13 text-muted">
        <Icon aria-hidden="true" size={15} strokeWidth={1.75} className="shrink-0" />
        {label}
      </span>
      {value === null ? (
        <span className="text-14 text-muted">{empty}</span>
      ) : (
        <>
          <span className="type-number text-24 leading-tight lg:text-32 font-semibold">{value}</span>
          {detail && <span className={cn("type-number text-13", tone === "danger" ? "text-danger" : "text-muted")}>{detail}</span>}
        </>
      )}
    </>
  );
  const classes = "panel flex min-h-30 min-w-0 flex-col gap-1.5 p-4";

  return href ? (
    <Link
      href={href}
      data-testid={`kpi-${id}`}
      className={cn(classes, "focus-ring transition-colors duration-(--duration-fast) ease-out hovered:border-accent/40")}
    >
      {body}
    </Link>
  ) : (
    <div data-testid={`kpi-${id}`} className={classes}>
      {body}
    </div>
  );
}
