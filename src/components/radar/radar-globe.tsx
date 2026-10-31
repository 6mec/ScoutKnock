"use client";

import createGlobe from "cobe";
import { useEffect, useRef } from "react";

const IDLE_ROTATION_PER_FRAME = 0.002;
const APPROACH_PER_FRAME = 0.04;
const MAX_PIXEL_RATIO = 2;
const START_PHI = 3.6;
const START_THETA = 0.2;
const FOCUSED_SCALE = 1.5;
const TURN = Math.PI * 2;

function anglesFor([latitude, longitude]: [number, number], fromPhi: number) {
  const phi = Math.PI - ((longitude * Math.PI) / 180 - Math.PI / 2);

  return {
    // A volta mais curta a partir de onde o globo está.
    phi: phi + TURN * Math.round((fromPhi - phi) / TURN),
    theta: (latitude * Math.PI) / 180,
    scale: FOCUSED_SCALE,
  };
}

// Decorativo. Sem localidade roda devagar; com localidade, roda até ela e aproxima.
export default function RadarGlobe({
  target,
}: {
  target: [number, number] | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef(target);
  const redrawRef = useRef<() => void>(() => {});

  useEffect(() => {
    targetRef.current = target;
    redrawRef.current();
  }, [target]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
        phi: START_PHI,
        theta: START_THETA,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 3,
        baseColor: [0.12, 0.16, 0.22],
        markerColor: [0.18, 0.89, 0.65],
        glowColor: [0.07, 0.09, 0.13],
      });
    } catch {
      // Sem WebGL, ficam os anéis do radar.
      return;
    }

    let frame = 0;
    let phi = START_PHI;
    let theta = START_THETA;
    let scale = 1;

    const step = (fraction: number) => {
      const wanted = targetRef.current
        ? anglesFor(targetRef.current, phi)
        : { phi: phi + IDLE_ROTATION_PER_FRAME, theta: START_THETA, scale: 1 };

      phi = targetRef.current ? phi + (wanted.phi - phi) * fraction : wanted.phi;
      theta += (wanted.theta - theta) * fraction;
      scale += (wanted.scale - scale) * fraction;
      globe.update({ phi, theta, scale });
    };
    const tick = () => {
      step(APPROACH_PER_FRAME);
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const start = () => {
      if (reduced || frame || document.hidden) return;
      frame = requestAnimationFrame(tick);
    };
    const syncVisibility = () => (document.hidden ? stop() : start());

    // Com movimento reduzido salta logo para a localidade.
    redrawRef.current = () => {
      if (reduced && targetRef.current) step(1);
    };
    redrawRef.current();

    document.addEventListener("visibilitychange", syncVisibility);
    start();

    return () => {
      stop();
      redrawRef.current = () => {};
      document.removeEventListener("visibilitychange", syncVisibility);
      globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="radar-globe"
      className="pointer-events-none absolute inset-0 size-full rounded-pill"
    />
  );
}
