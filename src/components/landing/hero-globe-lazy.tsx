"use client";

import dynamic from "next/dynamic";
import { useMediaQuery } from "@/lib/use-media-query";

// O WebGL carrega depois do resto, para não atrasar o título do herói.
const HeroGlobe = dynamic(() => import("./hero-globe"), { ssr: false });

// No telemóvel não descarrega o globo: ficam os anéis estáticos.
export function HeroGlobeLazy() {
  const isWide = useMediaQuery("(min-width: 768px)");

  return isWide ? <HeroGlobe /> : null;
}
