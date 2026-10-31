import { ptPT } from "@/i18n/pt-PT";
import { cn } from "@/lib/utils";

export function LiveDot({
  status = "live",
  label,
  className,
}: {
  status?: "live" | "searching";
  label?: string;
  className?: string;
}) {
  const color = status === "live" ? "bg-accent" : "bg-amber";

  return (
    <span className={cn("inline-flex items-center gap-2 text-14", className)}>
      <span aria-hidden="true" className="relative inline-flex size-2">
        <span
          className={cn(
            "absolute inset-0 animate-pulse-dot rounded-pill",
            color,
          )}
        />
        <span className={cn("relative size-2 rounded-pill", color)} />
      </span>
      {label ?? ptPT.ui.live[status]}
    </span>
  );
}
