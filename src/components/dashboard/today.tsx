"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { TodayPanels } from "@/components/contacts/crm-today";
import { useStatusChange } from "@/components/contacts/use-status-change";
import { PortfolioLinkContext } from "@/components/contacts/whatsapp-call-button";
import { ptPT } from "@/i18n/pt-PT";
import type { ContactEvent } from "@/lib/contacts/crm";
import type { Contact } from "@/lib/contacts/rules";

// O dia no Dashboard: a meta, a próxima da fila (com "Chamar no WhatsApp") e, ao lado,
// as próximas tarefas (children). "Abrir ficha" abre a ficha nos Contactos.
export function DashboardToday({
  contacts: initialContacts,
  events: initialEvents,
  dailyGoal: initialGoal,
  whatsappTemplate,
  portfolioUrl,
  children,
}: {
  contacts: Contact[];
  events: ContactEvent[];
  dailyGoal: number;
  whatsappTemplate: string | null;
  portfolioUrl: string | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const [contacts, setContacts] = useState(initialContacts);
  const [events, setEvents] = useState(initialEvents);
  const [dailyGoal, setDailyGoal] = useState(initialGoal);
  const [now] = useState(() => Date.now());
  const changeStatus = useStatusChange(contacts, setContacts, events, setEvents);

  return (
    <PortfolioLinkContext value={portfolioUrl}>
      <section aria-labelledby="hoje" className="flex flex-col gap-3 lg:col-span-2" data-testid="block-hoje">
        <h3 id="hoje" className="sr-only">
          {ptPT.dashboard.today}
        </h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <TodayPanels
            contacts={contacts}
            events={events}
            dailyGoal={dailyGoal}
            now={now}
            whatsappTemplate={whatsappTemplate}
            onGoalChange={setDailyGoal}
            onOpen={(id) => router.push(`/painel/contactos?contacto=${id}`)}
            onStatusChange={changeStatus}
          />
          <div className="flex md:col-span-2 xl:col-span-1">{children}</div>
        </div>
      </section>
    </PortfolioLinkContext>
  );
}
