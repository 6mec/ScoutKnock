import { ptPT } from "@/i18n/pt-PT";
import { cn } from "@/lib/utils";
import type { ConsolePhase } from "./radar-console";

const { radar: copy } = ptPT;

// Coordenadas do centro do distrito, só para o aspeto: a busca não usa estes números.
function formatCoords([lat, lng]: [number, number]) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "O";
  return `${Math.abs(lat).toFixed(2)}° ${ns} · ${Math.abs(lng).toFixed(2)}° ${ew}`;
}

const corner = "absolute size-6 border-accent/60";

// Mira e leituras por cima do globo. Decorativa: o formulário diz o mesmo em texto.
export function RadarHud({
  phase,
  locality,
  niche,
  target,
}: {
  phase: ConsolePhase;
  locality: string | null;
  niche: string;
  target: [number, number] | null;
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
      <span className={cn(corner, "top-0 left-0 rounded-tl-md border-t-2 border-l-2")} />
      <span className={cn(corner, "top-0 right-0 rounded-tr-md border-t-2 border-r-2")} />
      <span className={cn(corner, "bottom-0 left-0 rounded-bl-md border-b-2 border-l-2")} />
      <span className={cn(corner, "right-0 bottom-0 rounded-br-md border-r-2 border-b-2")} />
      <span className="absolute top-1/2 left-1/2 h-px w-10 -translate-x-1/2 bg-accent/40" />
      <span className="absolute top-1/2 left-1/2 h-10 w-px -translate-y-1/2 bg-accent/40" />

      <div className="absolute top-4 left-5 flex flex-col gap-0.5">
        <span className="type-mono text-12 tracking-wide text-muted uppercase">{copy.hud.target}</span>
        <span className="type-mono text-14 text-foreground">{locality ?? copy.hud.noTarget}</span>
        {target && <span className="type-mono text-12 text-accent">{formatCoords(target)}</span>}
      </div>
      <div className="absolute top-4 right-5 flex items-center gap-2">
        <span
          className={cn(
            "size-1.5 rounded-pill",
            phase === "searching" ? "animate-pulse-dot bg-amber" : "bg-accent",
          )}
        />
        <span className="type-mono text-12 tracking-wide text-muted uppercase">
          {copy.hud.status[phase]}
        </span>
      </div>
      <div className="absolute bottom-4 left-5 flex flex-col gap-0.5">
        <span className="type-mono text-12 tracking-wide text-muted uppercase">{copy.hud.niche}</span>
        <span className="type-mono max-w-56 truncate text-14 text-foreground">
          {niche.trim() || copy.hud.noTarget}
        </span>
      </div>
      <div className="absolute right-5 bottom-4 flex gap-1">
        {Array.from({ length: 12 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-3 w-1 rounded-pill bg-accent/25",
              phase === "searching" && "animate-pulse-dot",
              phase === "done" && "bg-accent/70",
            )}
            style={phase === "searching" ? { animationDelay: `${index * 120}ms` } : undefined}
          />
        ))}
      </div>
    </div>
  );
}
