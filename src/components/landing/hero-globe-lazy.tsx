"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

// O WebGL carrega depois do resto, para não atrasar o título do herói.
const HeroGlobe = dynamic(() => import("./hero-globe"), { ssr: false });

const WIDE_SCREEN = "(min-width: 768px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(WIDE_SCREEN);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// No telemóvel não descarrega o globo: ficam os anéis estáticos.
export function HeroGlobeLazy() {
  const isWide = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE_SCREEN).matches,
    () => false,
  );

  return isWide ? <HeroGlobe /> : null;
}
