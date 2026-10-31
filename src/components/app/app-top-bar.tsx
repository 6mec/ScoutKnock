"use client";

import { usePathname } from "next/navigation";
import { CommandPalette } from "@/components/app/command-palette";
import { ptPT } from "@/i18n/pt-PT";

const PAGE_TITLES: Record<string, string> = {
  "/painel": ptPT.app.nav.home,
  "/painel/radar": ptPT.app.nav.radar,
  "/painel/ui": ptPT.uiPreview.title,
};

export function AppTopBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-8">
      <h1 className="type-heading text-20">{PAGE_TITLES[pathname]}</h1>
      <CommandPalette />
    </header>
  );
}
