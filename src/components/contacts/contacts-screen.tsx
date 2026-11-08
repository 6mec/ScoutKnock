"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ptPT } from "@/i18n/pt-PT";
import {
  CONTACT_FILTERS,
  filterContacts,
  type ContactEvent,
  type ContactFilter,
} from "@/lib/contacts/crm";
import { manualColumns, type ManualCompany } from "@/lib/contacts/manual";
import type { FunnelStage } from "@/lib/dashboard/metrics";
import {
  searchContacts,
  type Contact,
  type ContactDetails,
  type ContactStatus,
} from "@/lib/contacts/rules";
import { AddCompanyButton } from "./add-company-button";
import { ContactDialog } from "./contact-dialog";
import { ContactsBoard } from "./contacts-board";
import { ContactsTable } from "./contacts-table";
import { ContactNumbers } from "./crm-today";
import { useStatusChange } from "./use-status-change";
import { ExportCsvButton } from "./export-csv-button";
import { ImportListButton } from "./import-list-button";
import { PortfolioLinkContext } from "./whatsapp-call-button";

const { contacts: copy } = ptPT;

export function ContactsScreen({
  initial,
  events: initialEvents,
  dailyGoal: initialGoal,
  whatsappTemplate: initialTemplate,
  portfolioUrl = null,
  statusFilter,
  openContactId = null,
  funnel = [],
}: {
  // Funil dos últimos 90 dias, calculado no servidor, para "Números dos contactos".
  funnel?: { stage: FunnelStage; count: number }[];
  portfolioUrl?: string | null;
  initial: Contact[];
  events: ContactEvent[];
  dailyGoal: number;
  whatsappTemplate: string | null;
  statusFilter: ContactStatus | null;
  // Vindo de outro ecrã (por exemplo, um projeto): abre logo esta ficha.
  openContactId?: string | null;
}) {
  const [contacts, setContacts] = useState(initial);
  const [events, setEvents] = useState(initialEvents);
  const [dailyGoal, setDailyGoal] = useState(initialGoal);
  const changeStatus = useStatusChange(contacts, setContacts, events, setEvents);
  const [lastInitial, setLastInitial] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(openContactId);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<ContactFilter>("all");
  const [template, setTemplate] = useState(initialTemplate);
  const [now] = useState(() => Date.now());

  // O Next guarda este ecrã escondido: ao voltar, os dados novos do servidor mandam.
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setContacts(initial);
    setEvents(initialEvents);
    setDailyGoal(initialGoal);
    if (openContactId) setOpenId(openContactId);
  }

  const open = contacts.find(({ id }) => id === openId);
  const filtered = statusFilter
    ? contacts.filter(({ status }) => status === statusFilter)
    : contacts;
  const visible = searchContacts(filterContacts(filtered, quickFilter, now), search);

  function handleSaved(id: string, details: ContactDetails) {
    setContacts((current) =>
      current.map((contact) =>
        contact.id === id
          ? {
              ...contact,
              label: details.label,
              confirmed_contact: details.confirmedContact,
              next_action: details.nextAction,
              next_action_at: details.nextActionAt,
              notes: details.notes,
              deal_value: details.dealValue,
              do_not_contact: details.doNotContact,
            }
          : contact,
      ),
    );
  }

  function handleManualSaved(id: string, company: ManualCompany) {
    setContacts((current) =>
      current.map((contact) =>
        contact.id === id
          ? { ...contact, label: company.name, ...manualColumns(company) }
          : contact,
      ),
    );
  }

  function handleOsmSaved(id: string, details: { address: string | null; phone: string | null }) {
    setContacts((current) =>
      current.map((contact) =>
        contact.id === id
          ? { ...contact, manual_address: details.address, manual_phone: details.phone }
          : contact,
      ),
    );
  }

  function handleAdded(contact: Contact) {
    setContacts((current) => [contact, ...current]);
    setOpenId(contact.id);
  }

  const manualActions = (
    <>
      <AddCompanyButton onAdded={handleAdded} />
      <ImportListButton contacts={contacts} />
    </>
  );

  function handleRemoved(id: string) {
    setOpenId(null);
    setContacts((current) => current.filter((contact) => contact.id !== id));
  }

  if (contacts.length === 0) {
    return (
      <div className="mx-auto w-full max-w-300 px-4 py-8 lg:px-8">
        <EmptyState
          title={copy.empty}
          className="bg-surface"
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="secondary">
                <Link href="/painel/radar">{ptPT.app.commands.goRadar}</Link>
              </Button>
              {manualActions}
            </div>
          }
        />
      </div>
    );
  }

  return (
    <PortfolioLinkContext value={portfolioUrl}>
    <div className="flex w-full min-w-0 flex-col gap-4 px-4 pt-4 pb-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Field label={copy.table.search} className="w-full max-w-md">
          <Input
            type="search"
            value={search}
            placeholder={copy.table.searchHelp}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          {manualActions}
          <ExportCsvButton contacts={visible} />
        </div>
      </div>
      <div role="group" aria-label={copy.crm.filters.label} className="flex flex-wrap gap-2">
        {CONTACT_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            aria-pressed={quickFilter === filter}
            onClick={() => setQuickFilter(filter)}
            className="focus-ring relative inline-flex h-8 items-center gap-1.5 rounded-pill border border-border px-3 text-13 text-muted transition-colors duration-(--duration-fast) before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-[''] hovered:text-foreground aria-pressed:border-accent/40 aria-pressed:bg-accent-soft aria-pressed:text-accent"
          >
            {copy.crm.filters[filter]}
            <span className="type-number text-12 opacity-80">
              {filterContacts(filtered, filter, now).length}
            </span>
          </button>
        ))}
      </div>
      {statusFilter && (
        <div className="flex flex-wrap items-center gap-x-4" data-testid="contacts-filter">
          <p className="font-semibold">
            {copy.filter.showing(copy.statuses[statusFilter])}
          </p>
          <Link
            href="/painel/contactos"
            className="focus-ring inline-flex min-h-11 items-center rounded-sm text-14 text-accent underline"
          >
            {copy.filter.clear}
          </Link>
          {filtered.length === 0 && (
            <p role="status" className="w-full text-muted">
              {copy.filter.empty}
            </p>
          )}
        </div>
      )}
      {(search || quickFilter !== "all") && visible.length === 0 && (
        <p role="status" className="text-muted">
          {copy.table.noMatches}
        </p>
      )}
      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">{copy.views.board}</TabsTrigger>
          <TabsTrigger value="table">{copy.views.table}</TabsTrigger>
        </TabsList>
        <TabsContent value="board">
          <ContactsBoard
            contacts={visible}
            onOpen={setOpenId}
            onStatusChange={changeStatus}
          />
        </TabsContent>
        <TabsContent value="table">
          <ContactsTable
            contacts={visible}
            onOpen={setOpenId}
            onStatusChange={changeStatus}
          />
        </TabsContent>
      </Tabs>
      <ContactNumbers contacts={contacts} events={events} dailyGoal={dailyGoal} now={now} funnel={funnel} />
      {open && (
        <ContactDialog
          key={open.id}
          contact={open}
          whatsappTemplate={template}
          onClose={() => setOpenId(null)}
          onStatusChange={changeStatus}
          onSaved={handleSaved}
          onManualSaved={handleManualSaved}
          onOsmSaved={handleOsmSaved}
          onRemoved={handleRemoved}
          onTemplateSaved={setTemplate}
        />
      )}
    </div>
    </PortfolioLinkContext>
  );
}
