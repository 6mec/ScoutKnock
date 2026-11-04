"use client";

import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";
import { useEffect, useRef, useState } from "react";
import type { ScoredCompany } from "@/lib/radar/search-events";
import type { ScoreLevel } from "@/lib/radar/types";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

// Mapa real da região durante a busca: abre ao nível do país, voa até à localidade
// e marca as empresas que trazem coordenadas (só as de exemplo, por agora).
const COUNTRY_ZOOM = 6;
const CITY_ZOOM = 12;
const MAX_BOUNDS_ZOOM = 14;
const FLY_SECONDS = 2;
const BOUNDS_SECONDS = 1.4;
const PIN_STAGGER_MS = 90;
const FIRST_PIN_MS = 1500;
const SETTLE_MS = 1100;
const MAX_PINS = 40;

const pinClasses: Record<ScoreLevel, string> = {
  strong: "bg-accent",
  medium: "bg-amber",
  weak: "bg-muted",
};

function pinHtml(level: ScoreLevel) {
  return `<span class="relative block size-4.5 animate-pin-drop"><span class="absolute inset-0 animate-ping rounded-pill ${pinClasses[level]} opacity-40"></span><span class="absolute inset-0.5 rounded-pill border-2 border-background ${pinClasses[level]}"></span></span>`;
}

export default function SearchRegionMap({
  target,
  revealAfterMs,
  companies,
  done,
  theme,
  onComplete,
}: {
  target: [number, number];
  revealAfterMs: number;
  companies: ScoredCompany[];
  done: boolean;
  theme: Theme;
  onComplete: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const placed = useRef(new Set<string>());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const completeRef = useRef(onComplete);
  const [visible, setVisible] = useState(false);
  // Depois de chegar à localidade, os pinos podem cair.
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  // O mapa monta logo, invisível, para as imagens do país já estarem carregadas
  // quando o globo acaba de rodar.
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const later = (fn: () => void, ms: number) =>
      timers.current.push(setTimeout(fn, reduced ? 0 : ms));
    let cancelled = false;

    // Se o mapa não carregar, os resultados não ficam à espera dele.
    import("leaflet").catch(() => {
      if (!cancelled) completeRef.current();
      return null;
    }).then((leaflet) => {
      if (!leaflet) return;
      if (cancelled) return;
      const L = leaflet.default ?? leaflet;
      leafletRef.current = L;
      const map = L.map(node, {
        zoomControl: false,
        attributionControl: true,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
        zoomSnap: 0,
      }).setView(target, reduced ? CITY_ZOOM : COUNTRY_ZOOM);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);
      mapRef.current = map;

      later(() => {
        setVisible(true);
        if (reduced) {
          setArrived(true);
          return;
        }
        map.flyTo(target, CITY_ZOOM, { duration: FLY_SECONDS });
        later(() => setArrived(true), FLY_SECONDS * 1000);
      }, revealAfterMs);
    });

    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // O alvo e o atraso só contam no início da busca.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pinos: o primeiro grupo cai em fila depois de o mapa enquadrar as empresas;
  // as que chegam depois caem logo.
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!arrived || !map || !L) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const located = companies
      .filter((item) => item.company.location)
      .slice(0, MAX_PINS);
    const fresh = located.filter((item) => !placed.current.has(item.company.id));
    const firstBatch = placed.current.size === 0 && fresh.length > 0;

    if (firstBatch && !reduced) {
      try {
        map.flyToBounds(
          L.latLngBounds(located.map((item) => item.company.location!)).pad(0.25),
          { duration: BOUNDS_SECONDS, maxZoom: MAX_BOUNDS_ZOOM },
        );
      } catch {}
    }

    fresh.forEach((item, index) => {
      placed.current.add(item.company.id);
      const delay = reduced ? 0 : firstBatch ? FIRST_PIN_MS + index * PIN_STAGGER_MS : 0;
      timers.current.push(
        setTimeout(() => {
          if (!mapRef.current) return;
          L.marker(item.company.location!, {
            interactive: false,
            keyboard: false,
            icon: L.divIcon({
              className: "",
              html: pinHtml(item.opportunity.level),
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            }),
          }).addTo(mapRef.current);
        }, delay),
      );
    });
  }, [arrived, companies]);

  // Só mostra os resultados quando o último pino caiu e o mapa assentou.
  useEffect(() => {
    if (!done || !arrived) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      completeRef.current();
      return;
    }
    const pins = Math.min(
      companies.filter((item) => item.company.location).length,
      MAX_PINS,
    );
    const timer = setTimeout(
      () => completeRef.current(),
      pins ? FIRST_PIN_MS + pins * PIN_STAGGER_MS + SETTLE_MS : SETTLE_MS,
    );
    return () => clearTimeout(timer);
  }, [done, arrived, companies]);

  return (
    <div
      data-testid="search-map"
      data-arrived={arrived || undefined}
      className={cn(
        "absolute inset-0 z-10 overflow-hidden rounded-lg border border-border bg-surface transition-opacity duration-500",
        visible ? "opacity-100" : "opacity-0",
        // No escuro, as imagens do mapa invertem-se para acompanharem o tema.
        theme === "dark" &&
          "[&_.leaflet-tile-pane]:[filter:invert(1)_hue-rotate(180deg)_brightness(0.85)_contrast(0.9)_saturate(0.6)]",
        "[&_.leaflet-control-attribution]:!bg-surface/80 [&_.leaflet-control-attribution]:!text-muted [&_.leaflet-control-attribution_a]:!text-muted",
      )}
    >
      {/* O Leaflet põe as suas classes neste elemento: o React nunca lhe muda a classe. */}
      <div ref={container} className="size-full bg-surface" />
    </div>
  );
}
