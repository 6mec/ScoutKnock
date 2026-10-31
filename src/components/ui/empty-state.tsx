import { Radar } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-lg border border-border-subtle p-8 text-center",
        className,
      )}
    >
      <Radar
        aria-hidden="true"
        size={20}
        strokeWidth={1.5}
        className="text-muted"
      />
      <p className="type-body text-muted">{title}</p>
      {action}
    </div>
  );
}
