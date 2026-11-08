"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ptPT } from "@/i18n/pt-PT";

const { projects: copy } = ptPT;
export const REQUESTS_TAB = "pedidos";

// Projetos e Pedidos no mesmo ecrã. O separador fica no endereço (?separador=pedidos),
// para os links "Ver o pedido" e o antigo /painel/pedidos abrirem no sítio certo.
export function ProjectsTabs({
  projects,
  requests,
  openRequests,
}: {
  projects: ReactNode;
  requests: ReactNode;
  // Pedidos por fazer ou em curso, para o número no separador.
  openRequests: number;
}) {
  const params = useSearchParams();
  const tab = params.get("separador") === REQUESTS_TAB ? REQUESTS_TAB : "projetos";

  function change(value: string) {
    const next = new URLSearchParams(params);
    if (value === REQUESTS_TAB) next.set("separador", REQUESTS_TAB);
    else next.delete("separador");
    const query = next.toString();
    // Sem pedido ao servidor: o Next acompanha o replaceState no useSearchParams.
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }

  return (
    <Tabs value={tab} onValueChange={change}>
      <div className="mx-auto w-full max-w-300 px-4 pt-4 lg:px-8">
        <TabsList>
          <TabsTrigger value="projetos">{copy.tabs.projects}</TabsTrigger>
          <TabsTrigger value={REQUESTS_TAB} data-testid="tab-requests">
            {copy.tabs.requests}
            {openRequests > 0 && (
              <span className="ml-1.5 rounded-pill bg-accent-soft px-1.5 text-12 tabular-nums text-accent">
                {openRequests}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="projetos" className="pt-0">
        {projects}
      </TabsContent>
      <TabsContent value={REQUESTS_TAB} className="pt-0">
        {requests}
      </TabsContent>
    </Tabs>
  );
}
