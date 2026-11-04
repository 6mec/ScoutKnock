import Link from "next/link";
import type { ReactNode } from "react";
import { RadarRings } from "@/components/landing/radar-rings";
import { Logo } from "@/components/ui/logo";
import { ptPT } from "@/i18n/pt-PT";

const copy = ptPT.auth;

// Formulário à esquerda; painel com o radar ambiente à direita, só no computador.
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <main className="flex flex-col items-center justify-center gap-8 px-4 py-12">
        <div className="flex w-full max-w-100 flex-col gap-8">
          <Link
            href="/"
            aria-label={copy.homeLink}
            className="focus-ring self-start rounded-sm"
          >
            <Logo />
          </Link>
          <section className="panel p-6">
            {children}
          </section>
        </div>
      </main>
      <aside className="relative hidden items-center justify-center overflow-hidden border-l border-border bg-surface px-10 lg:flex">
        <RadarRings
          sweep
          className="top-1/2 left-1/2 size-225 -translate-x-1/2 -translate-y-1/2 opacity-55"
        />
        <p className="type-display relative max-w-120 text-center text-44">
          {copy.panelPhrase}
        </p>
      </aside>
    </div>
  );
}
