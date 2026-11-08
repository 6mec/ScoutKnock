import { useSyncExternalStore } from "react";
import { THEME_KEY } from "./theme-script";

export type Theme = "dark" | "light";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// A classe no html é a fonte de verdade: o claro é o defeito no servidor.
function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function useTheme() {
  return useSyncExternalStore(subscribe, currentTheme, () => "light" as Theme);
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Sem armazenamento, a escolha vale só até recarregar.
  }
  listeners.forEach((listener) => listener());
}

export function toggleTheme() {
  setTheme(currentTheme() === "dark" ? "light" : "dark");
}

export const GLOBE_COLORS = {
  dark: {
    dark: 1,
    mapBrightness: 3,
    baseColor: [0.14, 0.15, 0.13],
    markerColor: [0.62, 0.72, 0.62],
    glowColor: [0.08, 0.08, 0.07],
    arcColor: [0.62, 0.72, 0.62],
  },
  light: {
    dark: 0,
    mapBrightness: 5,
    baseColor: [0.91, 0.91, 0.89],
    markerColor: [0.39, 0.48, 0.39],
    glowColor: [0.97, 0.97, 0.96],
    arcColor: [0.39, 0.48, 0.39],
  },
} satisfies Record<Theme, {
  dark: number;
  mapBrightness: number;
  baseColor: [number, number, number];
  markerColor: [number, number, number];
  glowColor: [number, number, number];
  arcColor: [number, number, number];
}>;
