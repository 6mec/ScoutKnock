import type { MetadataRoute } from "next";
import { ptPT } from "@/i18n/pt-PT";

// Para instalar o ScoutKnock no telemóvel ou no computador, com o próprio ícone.
// Abre no painel: quem não tiver sessão vai para a entrada, como no browser.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: ptPT.brand.name,
    short_name: ptPT.brand.name,
    description: ptPT.brand.tagline,
    lang: "pt-PT",
    start_url: "/painel",
    scope: "/",
    display: "standalone",
    background_color: "#0B0F14",
    theme_color: "#0B0F14",
    icons: [
      { src: "/brand/app-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/app-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/app-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
