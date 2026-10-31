import { ptPT } from "@/i18n/pt-PT";
import { HERO_COMPANIES } from "@/lib/radar/landing-examples";
import { scoreCompany } from "@/lib/radar/score";
import type { ScoreLevel } from "@/lib/radar/types";
import { cn } from "@/lib/utils";

const { hero } = ptPT.landing;
const { radar } = ptPT;

const SWEEP_SECONDS = 4;
const CENTER = 120;

const chipClasses: Record<ScoreLevel, string> = {
  strong: "bg-accent text-accent-contrast",
  medium: "bg-amber text-accent-contrast",
  weak: "border border-border-input text-foreground",
};

const BLIPS = [
  { x: 168, y: 70, r: 5, fill: "var(--accent)" },
  { x: 78, y: 96, r: 4, fill: "var(--accent)" },
  { x: 150, y: 170, r: 4, fill: "var(--muted)" },
  { x: 52, y: 160, r: 3.5, fill: "var(--muted)" },
];
const HIGHLIGHT = { x: 190, y: 132, r: 4.5 };

// Cada empresa acende quando o feixe, que começa em cima, passa por ela.
function sweepDelay(x: number, y: number) {
  const degrees =
    (Math.atan2(x - CENTER, CENTER - y) * 180) / Math.PI;
  return `${(((degrees + 360) % 360) / 360) * SWEEP_SECONDS}s`;
}

export function HeroRadar() {
  const rows = HERO_COMPANIES.map((company) => ({
    company,
    opportunity: scoreCompany(company, "website_creation"),
  }));

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap gap-2 border-b border-border p-4">
        {hero.filters.map((filter) => (
          <span
            key={filter}
            className="type-number rounded-sm border border-border bg-background px-2.5 py-1 text-12"
          >
            {filter}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap">
        <div className="flex flex-[1_1_220px] items-center justify-center p-5">
          <svg
            viewBox="0 0 240 240"
            width={220}
            height={220}
            role="img"
            aria-label={hero.radarLabel}
            className="max-w-full"
          >
            <g fill="none" stroke="var(--border)">
              <circle cx={CENTER} cy={CENTER} r="32" />
              <circle cx={CENTER} cy={CENTER} r="64" />
              <circle cx={CENTER} cy={CENTER} r="96" />
              <circle cx={CENTER} cy={CENTER} r="118" />
              <path d="M120 2V238M2 120H238" />
            </g>
            <g
              className="animate-radar-sweep"
              style={{ transformOrigin: "120px 120px" }}
            >
              <path
                d="M120 120L36.6 36.6A118 118 0 0 1 120 2Z"
                fill="var(--accent)"
                fillOpacity=".07"
              />
              <path
                d="M120 120L79.6 9.1A118 118 0 0 1 120 2Z"
                fill="var(--accent)"
                fillOpacity=".14"
              />
              <path d="M120 120L120 2" stroke="var(--accent)" strokeWidth="1.6" />
            </g>
            {BLIPS.map((blip) => (
              <circle
                key={`${blip.x}-${blip.y}`}
                cx={blip.x}
                cy={blip.y}
                r={blip.r}
                fill={blip.fill}
                className="animate-blip"
                style={{ animationDelay: sweepDelay(blip.x, blip.y) }}
              />
            ))}
            <circle
              cx={HIGHLIGHT.x}
              cy={HIGHLIGHT.y}
              r={HIGHLIGHT.r}
              fill="var(--amber)"
              className="animate-blip"
              style={{ animationDelay: sweepDelay(HIGHLIGHT.x, HIGHLIGHT.y) }}
            />
            <circle
              cx={HIGHLIGHT.x}
              cy={HIGHLIGHT.y}
              r={HIGHLIGHT.r}
              fill="none"
              stroke="var(--amber)"
              opacity="0"
              className="animate-ping"
              style={{
                transformOrigin: `${HIGHLIGHT.x}px ${HIGHLIGHT.y}px`,
                animationDelay: sweepDelay(HIGHLIGHT.x, HIGHLIGHT.y),
              }}
            />
            <circle cx={CENTER} cy={CENTER} r="3" fill="var(--foreground)" />
          </svg>
        </div>
        <ul className="flex min-w-0 flex-[1_1_240px] flex-col">
          {rows.map(({ company, opportunity }, index) => (
            <li
              key={company.id}
              className={cn(
                "flex items-center gap-3 border-b border-border p-4 last:border-b-0",
                index === 0 && "animate-breathe",
              )}
            >
              <span
                className={cn(
                  "type-number inline-flex h-8 min-w-10 items-center justify-center rounded-sm px-2 text-18 font-semibold",
                  chipClasses[opportunity.level],
                )}
              >
                {opportunity.score}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{company.name}</p>
                <p className="text-13 text-muted">
                  {opportunity.reasons[0]
                    ? radar.reasons[opportunity.reasons[0].code]
                    : radar.noReasons}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="type-number border-t border-border px-4 py-2.5 text-12 text-muted">
        {hero.exampleNote}
      </p>
    </div>
  );
}
