"use client";

import dynamic from "next/dynamic";
import { useTheme } from "@/lib/theme";
import { useMediaQuery } from "@/lib/use-media-query";

// O WebGL carrega depois do resto, para não atrasar o título do herói.
const HeroGlobe = dynamic(() => import("./hero-globe"), { ssr: false });

// No telemóvel não descarrega o globo: ficam os anéis estáticos.
export function HeroGlobeLazy({ withBrazil }: { withBrazil: boolean }) {
  const isWide = useMediaQuery("(min-width: 768px)");

  const theme = useTheme();

  return isWide ? (
    <HeroGlobe key={theme} theme={theme} withBrazil={withBrazil} />
  ) : null;
}
