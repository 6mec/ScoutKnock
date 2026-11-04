import type { ContactStatus } from "@/lib/contacts/rules";
import { cn } from "@/lib/utils";

// A cor acompanha sempre o nome do estado: nunca é a única pista.
export const statusDotClasses: Record<ContactStatus, string> = {
  to_contact: "bg-border-strong",
  contacted: "bg-muted",
  replied: "bg-info",
  proposal: "bg-amber",
  won: "bg-accent",
  lost: "bg-danger",
};

export function StatusDot({ status, className }: { status: ContactStatus; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-2 shrink-0 rounded-pill", statusDotClasses[status], className)}
    />
  );
}
