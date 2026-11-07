"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestNewSearch } from "@/lib/radar/new-search";
import { CommandPalette } from "@/components/app/command-palette";
import { Logo } from "@/components/ui/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";

const PAGE_TITLES: Record<string, string> = {
  radar: ptPT.app.nav.radar,
  demos: ptPT.app.nav.demos,
  contactos: ptPT.app.nav.contacts,
  portfolio: ptPT.portfolio.title,
  pedidos: ptPT.app.nav.requests,
  projetos: ptPT.app.nav.projects,
  planos: ptPT.plans.title,
  conta: ptPT.app.account.label,
  ui: ptPT.uiPreview.title,
};

function PageTitle() {
  const segment = useSelectedLayoutSegment();

  return (
    <h1 className="type-heading text-20">
      {segment ? PAGE_TITLES[segment] : ptPT.app.nav.home}
    </h1>
  );
}

// O segmento só se conhece no pedido nas rotas dinâmicas, daí o Suspense.
export function AppTopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 print:hidden items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        {/* No computador, o logótipo está no menu lateral. */}
        <Link
          href="/painel"
          aria-label={ptPT.app.nav.homeLogo}
          className="focus-ring inline-flex size-11 shrink-0 items-center justify-center rounded-sm md:hidden"
        >
          <Logo showWordmark={false} size={28} />
        </Link>
        <Suspense fallback={<Skeleton className="h-6 w-24" />}>
          <PageTitle />
        </Suspense>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {/* A ação principal, sempre à mão: no telemóvel só com o ícone. */}
        <Button asChild size="sm" className="h-10 px-3" data-testid="top-new-search">
          <Link href="/painel/radar" onClick={requestNewSearch} aria-label={ptPT.dashboard.newSearch}>
            <Search aria-hidden="true" size={16} />
            <span className="hidden sm:inline">{ptPT.dashboard.newSearch}</span>
          </Link>
        </Button>
        <CommandPalette />
      </div>
    </header>
  );
}
