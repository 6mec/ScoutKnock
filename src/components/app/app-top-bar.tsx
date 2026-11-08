"use client";

import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestNewSearch } from "@/lib/radar/new-search";
import { CommandPalette } from "@/components/app/command-palette";
import { Logo } from "@/components/ui/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { crumbsFor } from "./nav-items";

// O caminho da página: o grupo do menu, a página e a subpágina. O último é o título.
function PageTitle() {
  const crumbs = crumbsFor(useSelectedLayoutSegments());
  const current = crumbs[crumbs.length - 1];
  const before = crumbs.slice(0, -1);

  return (
    <div className="flex min-w-0 flex-col justify-center">
      {before.length > 0 && (
        <nav aria-label={ptPT.app.nav.crumbs.label} className="hidden sm:block">
          <ol className="flex items-center gap-1.5 text-12 text-muted">
            {before.map((crumb) => (
              <li key={crumb.label} className="flex items-center gap-1.5">
                {crumb.href ? (
                  <Link href={crumb.href} className="focus-ring rounded-sm hovered:text-foreground">
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
                <ChevronRight aria-hidden="true" size={12} className="text-border-strong" />
              </li>
            ))}
          </ol>
        </nav>
      )}
      <h1 className="type-heading truncate text-18 sm:text-20">{current.label}</h1>
    </div>
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
