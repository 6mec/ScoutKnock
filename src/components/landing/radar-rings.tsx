import { cn } from "@/lib/utils";

// Anéis decorativos atrás do herói e do formulário final.
export function RadarRings({
  sweep = false,
  fast = false,
  className,
}: {
  sweep?: boolean;
  // Mais rápido durante uma busca. Com movimento reduzido, não roda.
  fast?: boolean;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 900 900"
      fill="none"
      className={cn("pointer-events-none absolute text-border", className)}
    >
      <g stroke="currentColor">
        <circle cx="450" cy="450" r="130" />
        <circle cx="450" cy="450" r="230" />
        <circle cx="450" cy="450" r="330" />
        <circle cx="450" cy="450" r="430" />
        <path d="M450 0V900M0 450H900" />
      </g>
      {sweep && (
        <path
          d="M450 450L450 20"
          stroke="var(--accent)"
          strokeOpacity=".3"
          className={fast ? "animate-radar-sweep" : "animate-radar-sweep-slow"}
          style={{ transformOrigin: "450px 450px" }}
        />
      )}
    </svg>
  );
}
