"use client";

import dynamic from "next/dynamic";
import { RadarRings } from "@/components/landing/radar-rings";
import { useTheme } from "@/lib/theme";
import { useMediaQuery } from "@/lib/use-media-query";

const RadarGlobe = dynamic(() => import("./radar-globe"), { ssr: false });

// Anéis sempre presentes; o globo só carrega em ecrãs largos.
export function RadarStage({
  target,
  searching,
}: {
  target: [number, number] | null;
  searching: boolean;
}) {
  const isWide = useMediaQuery("(min-width: 1024px)");
  const theme = useTheme();

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-square w-full max-w-40 lg:max-w-160"
    >
      <RadarRings sweep={searching} className="inset-0 size-full opacity-55" />
      {isWide && <RadarGlobe key={theme} theme={theme} target={searching ? target : null} />}
      {searching && target && (
        <span className="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2">
          <span className="absolute inset-0 animate-ping rounded-pill border border-amber" />
          <span className="absolute inset-0 rounded-pill bg-amber" />
        </span>
      )}
    </div>
  );
}
