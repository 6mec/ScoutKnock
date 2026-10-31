import { ptPT } from "@/i18n/pt-PT";
import { cn } from "@/lib/utils";

const MIN_MARK_SIZE = 24;

// Cores fixas do símbolo (ver marca.md). Só a linha de varrimento se mexe.
export function Logo({
  size = 32,
  searching = false,
  showWordmark = true,
  className,
}: {
  size?: number;
  searching?: boolean;
  showWordmark?: boolean;
  className?: string;
}) {
  const { brand } = ptPT;
  const markSize = Math.max(size, MIN_MARK_SIZE);

  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 64 64"
        width={markSize}
        height={markSize}
        role={showWordmark ? undefined : "img"}
        aria-label={showWordmark ? undefined : brand.name}
        aria-hidden={showWordmark || undefined}
        className="shrink-0"
      >
        <rect width="64" height="64" rx="14" fill="#0B0F14" />
        <g fill="none" stroke="#2DE2A6" strokeLinecap="round" strokeWidth="3.5">
          <path d="M14 32a18 18 0 0 1 18-18" opacity="0.45" />
          <path d="M22 32a10 10 0 0 1 10-10" />
        </g>
        <path
          d="M32 32L47 47"
          stroke="#2DE2A6"
          strokeWidth="3.5"
          strokeLinecap="round"
          className={searching ? "animate-sweep-loop" : "animate-sweep-once"}
          style={{ transformOrigin: "32px 32px" }}
        />
        <circle cx="32" cy="32" r="4" fill="#2DE2A6" />
        <circle cx="46" cy="20" r="5" fill="#FFB547" />
      </svg>
      {showWordmark && (
        <span className="text-20 font-bold tracking-tight">
          <span className="text-foreground">{brand.scout}</span>
          <span className="text-accent">{brand.knock}</span>
        </span>
      )}
    </span>
  );
}
