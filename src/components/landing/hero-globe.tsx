"use client";

import createGlobe, { type Marker } from "cobe";
import { useEffect, useRef } from "react";
import { GLOBE_COLORS, type Theme } from "@/lib/theme";

const ROTATION_PER_FRAME = 0.002;
const PULSE_PER_FRAME = 0.03;
const MAX_PIXEL_RATIO = 2;

const LISBON: [number, number] = [38.72, -9.14];
const SAO_PAULO: [number, number] = [-23.55, -46.63];

const PORTUGAL_CITIES: { location: [number, number]; size: number }[] = [
  { location: LISBON, size: 0.05 },
  { location: [41.15, -8.61], size: 0.04 },
];
const BRAZIL_CITIES: { location: [number, number]; size: number }[] = [
  { location: SAO_PAULO, size: 0.05 },
  { location: [-22.91, -43.17], size: 0.04 },
];

// Decorativo. Pausa fora do ecrã ou com o separador escondido, e fica parado com movimento reduzido.
export default function HeroGlobe({
  theme,
  withBrazil,
}: {
  theme: Theme;
  withBrazil: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cities = withBrazil
      ? [...PORTUGAL_CITIES, ...BRAZIL_CITIES]
      : PORTUGAL_CITIES;
    const markersAt = (pulse: number): Marker[] =>
      cities.map((city) => ({
        location: city.location,
        size: city.size * (1 + 0.3 * Math.sin(pulse)),
      }));

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const size = canvas.offsetWidth;
    const pixelRatio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);

    let globe: ReturnType<typeof createGlobe>;
    try {
      globe = createGlobe(canvas, {
        width: size * pixelRatio,
        height: size * pixelRatio,
        devicePixelRatio: pixelRatio,
        phi: 3.6,
        theta: 0.2,
        ...GLOBE_COLORS[theme],
        diffuse: 1.2,
        mapSamples: 16000,
        markers: markersAt(0),
        arcs: withBrazil ? [{ from: LISBON, to: SAO_PAULO }] : [],
        arcWidth: 0.5,
        arcHeight: 0.3,
      });
    } catch {
      // Sem WebGL, os anéis estáticos ficam no lugar do globo.
      return;
    }

    let frame = 0;
    let phi = 3.6;
    let pulse = 0;
    let onScreen = true;

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const tick = () => {
      phi += ROTATION_PER_FRAME;
      pulse += PULSE_PER_FRAME;
      globe.update({ phi, markers: markersAt(pulse) });
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (reduced || frame || !onScreen || document.hidden) return;
      frame = requestAnimationFrame(tick);
    };
    const syncVisibility = () => (document.hidden ? stop() : start());

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", syncVisibility);
    start();

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncVisibility);
      globe.destroy();
    };
  }, [theme, withBrazil]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="hero-globe"
      className="pointer-events-none absolute -top-10 right-0 size-180 opacity-25"
    />
  );
}
