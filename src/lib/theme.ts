import { useSyncExternalStore } from "react";
import { THEME_KEY } from "./theme-script";

export type Theme = "dark" | "light";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// A classe no html é a fonte de verdade: o escuro é o defeito no servidor.
function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function useTheme() {
  return useSyncExternalStore(subscribe, currentTheme, () => "dark" as Theme);
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
    baseColor: [0.12, 0.16, 0.22],
    markerColor: [0.18, 0.89, 0.65],
    glowColor: [0.07, 0.09, 0.13],
    arcColor: [0.18, 0.89, 0.65],
  },
  light: {
    dark: 0,
    mapBrightness: 5,
    baseColor: [0.88, 0.91, 0.94],
    markerColor: [0.04, 0.5, 0.36],
    glowColor: [0.93, 0.95, 0.97],
    arcColor: [0.04, 0.5, 0.36],
  },
} satisfies Record<Theme, {
  dark: number;
  mapBrightness: number;
  baseColor: [number, number, number];
  markerColor: [number, number, number];
  glowColor: [number, number, number];
  arcColor: [number, number, number];
}>;
