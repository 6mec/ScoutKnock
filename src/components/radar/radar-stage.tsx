"use client";

import dynamic from "next/dynamic";
import { RadarRings } from "@/components/landing/radar-rings";
import { ptPT } from "@/i18n/pt-PT";
import type { ScoredCompany } from "@/lib/radar/search-events";
import { useTheme } from "@/lib/theme";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

const RadarGlobe = dynamic(() => import("./radar-globe"), { ssr: false });
const SearchRegionMap = dynamic(() => import("./search-region-map"), { ssr: false });
// No computador o globo roda até à localidade antes de o mapa da cidade aparecer.
const MAP_AFTER_GLOBE_MS = 1600;
const MAP_WITHOUT_GLOBE_MS = 300;

// Anéis sempre presentes; o globo só carrega em ecrãs largos. Durante a busca, depois
// de o globo chegar à localidade, abre o mapa real da região com as empresas.
export function RadarStage({
  target,
  searching,
  companies = [],
  done = false,
  onMapComplete,
  isSample = false,
  className,
}: {
  isSample?: boolean;
  className?: string;
  target: [number, number] | null;
  searching: boolean;
  companies?: ScoredCompany[];
  done?: boolean;
  onMapComplete?: () => void;
}) {
  const isWide = useMediaQuery("(min-width: 1024px)");
  const theme = useTheme();

  const showMap = Boolean(searching && onMapComplete && target);

  return (
    <div className={cn("flex w-full flex-col items-center gap-3", className)}>
      <div
        aria-hidden="true"
        className={cn(
          "relative mx-auto aspect-square w-full max-w-40 transition-[max-width] duration-(--duration-base) lg:max-w-160",
          showMap && "max-w-90",
        )}
      >
        <RadarRings sweep={searching} className="inset-0 size-full opacity-55" />
        {isWide && <RadarGlobe key={theme} theme={theme} target={searching ? target : null} />}
        {showMap && target && onMapComplete && (
          <SearchRegionMap
            target={target}
            revealAfterMs={isWide ? MAP_AFTER_GLOBE_MS : MAP_WITHOUT_GLOBE_MS}
            companies={companies}
            done={done}
            theme={theme}
            onComplete={onMapComplete}
          />
        )}
        {searching && target && (
          <span className="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2">
            <span className="absolute inset-0 animate-ping rounded-pill border border-amber" />
            <span className="absolute inset-0 rounded-pill bg-amber" />
          </span>
        )}
      </div>
      {showMap && isSample && <p className="text-13 text-muted">{ptPT.radar.mapNote}</p>}
    </div>
  );
}
