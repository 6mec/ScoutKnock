import { ptPT } from "@/i18n/pt-PT";
import { PORTUGAL_AREAS } from "@/lib/radar/localities";
import { cn } from "@/lib/utils";
import type { SearchUsage } from "./radar-screen";

const { radar: copy } = ptPT;
const COUNCILS = new Set(PORTUGAL_AREAS.flatMap(({ concelhos }) => concelhos)).size;

export type ConsolePhase = "idle" | "searching" | "done";

// Faixa de estado no topo do Radar: só factos (fonte, cobertura, buscas usadas).
export function RadarConsole({
  phase,
  isSample,
  usage,
  isAdmin,
}: {
  phase: ConsolePhase;
  isSample: boolean;
  usage: SearchUsage | null;
  isAdmin: boolean;
}) {
  const status =
    phase === "searching"
      ? copy.console.searching
      : phase === "done"
        ? copy.console.done
        : isSample
          ? copy.console.sample
          : copy.console.ready;
  const percent =
    usage && usage.limit > 0 ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;

  return (
    <section
      aria-label={copy.console.label}
      data-testid="radar-console"
      className="flex flex-wrap items-stretch gap-x-6 gap-y-3 rounded-lg border border-border bg-surface/70 px-4 py-3 backdrop-blur-sm"
    >
      <p
        role="status"
        className="flex items-center gap-2.5 text-14 font-semibold"
      >
        <span aria-hidden="true" className="relative flex size-2.5">
          <span
            className={cn(
              "absolute inset-0 rounded-pill opacity-60",
              phase === "searching" && "animate-ping",
              isSample && phase === "idle" ? "bg-amber" : "bg-accent",
            )}
          />
          <span
            className={cn(
              "relative size-2.5 rounded-pill",
              isSample && phase === "idle" ? "bg-amber" : "bg-accent",
            )}
          />
        </span>
        {status}
      </p>
      <dl className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Reading label={copy.console.source}>
          {isSample ? copy.console.sourceSample : copy.console.sourceGoogle}
        </Reading>
        <Reading label={copy.console.coverage}>
          {copy.console.coverageValue(PORTUGAL_AREAS.length, COUNCILS)}
        </Reading>
        {(isAdmin || usage) && (
          <Reading label={copy.console.searches}>
            <span className="flex items-center gap-2" data-testid="console-searches">
              {isAdmin
                ? copy.console.unlimited
                : copy.console.searchesValue(usage!.used, usage!.limit)}
              {!isAdmin && (
                <span
                  aria-hidden="true"
                  className="h-1 w-14 overflow-hidden rounded-pill bg-border"
                >
                  <span
                    className={cn(
                      "block h-full rounded-pill",
                      percent >= 100 ? "bg-amber" : "bg-accent",
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </span>
              )}
            </span>
          </Reading>
        )}
      </dl>
    </section>
  );
}

function Reading({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="type-mono text-12 tracking-wide text-muted uppercase">{label}</dt>
      <dd className="type-mono text-13 text-foreground">{children}</dd>
    </div>
  );
}
