import { DM_Serif_Display, Fraunces, Inter, Nunito, Oswald, Playfair_Display } from "next/font/google";
import type { FontKey } from "./identities";

// As letras dos sites demo ficam alojadas no nosso servidor (o Next descarrega-as no
// build): a página da empresa não pede nada ao Google. Sem preload, cada uma só se
// descarrega quando um site a usa.
const oswald = Oswald({ subsets: ["latin"], variable: "--demo-oswald", preload: false, display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--demo-playfair", preload: false, display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--demo-fraunces", preload: false, display: "swap" });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--demo-dmserif", preload: false, display: "swap" });
const nunito = Nunito({ subsets: ["latin"], variable: "--demo-nunito", preload: false, display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--demo-inter", preload: false, display: "swap" });

export const DEMO_FONT_VARIABLES = [oswald, playfair, fraunces, dmSerif, nunito, inter]
  .map((font) => font.variable)
  .join(" ");

export const FONT_FAMILIES: Record<FontKey, string> = {
  oswald: "var(--demo-oswald), system-ui, sans-serif",
  playfair: "var(--demo-playfair), Georgia, serif",
  fraunces: "var(--demo-fraunces), Georgia, serif",
  dmSerif: "var(--demo-dmserif), Georgia, serif",
  nunito: "var(--demo-nunito), system-ui, sans-serif",
  inter: "var(--demo-inter), system-ui, sans-serif",
};

export const FONT_LABELS: Record<FontKey, string> = {
  oswald: "Oswald",
  playfair: "Playfair Display",
  fraunces: "Fraunces",
  dmSerif: "DM Serif Display",
  nunito: "Nunito",
  inter: "Inter",
};
