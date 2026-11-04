"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { setContactStatus } from "@/lib/contacts/actions";
import { manualColumns, type ManualCompany } from "@/lib/contacts/manual";
import {
  marksLastContact,
  type Contact,
  type ContactDetails,
  type ContactStatus,
} from "@/lib/contacts/rules";
import { AddCompanyButton } from "./add-company-button";
import { ContactDialog } from "./contact-dialog";
import { ContactsBoard } from "./contacts-board";
import { ContactsTable } from "./contacts-table";
import { ImportListButton } from "./import-list-button";

const { contacts: copy } = ptPT;

export function ContactsScreen({
  initial,
  statusFilter,
}: {
  initial: Contact[];
  statusFilter: ContactStatus | null;
}) {
  const [contacts, setContacts] = useState(initial);
  const [lastInitial, setLastInitial] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);

  // O Next guarda este ecrã escondido: ao voltar, os dados novos do servidor mandam.
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setContacts(initial);
  }

  const open = contacts.find(({ id }) => id === openId);
  const visible = statusFilter
    ? contacts.filter(({ status }) => status === statusFilter)
    : contacts;

  function changeStatus(id: string, status: ContactStatus) {
    const previous = contacts;

    // Muda logo no ecrã; se o servidor recusar, volta atrás.
    setContacts((current) =>
      current.map((contact) =>
        contact.id === id
          ? {
              ...contact,
              status,
              last_contacted_at: marksLastContact(status)
                ? new Date().toISOString()
                : contact.last_contacted_at,
            }
          : contact,
      ),
    );

    setContactStatus(id, status).then(({ ok }) => {
      if (!ok) {
        setContacts(previous);
        toast.error(copy.errors.generic);
      }
    });
  }

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
    <div className="flex w-full min-w-0 flex-col gap-4 px-4 py-6 lg:px-8">
      <div className="flex flex-wrap gap-3">{manualActions}</div>
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
          {visible.length === 0 && (
            <p role="status" className="w-full text-muted">
              {copy.filter.empty}
            </p>
          )}
        </div>
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
      {open && (
        <ContactDialog
          key={open.id}
          contact={open}
          onClose={() => setOpenId(null)}
          onStatusChange={changeStatus}
          onSaved={handleSaved}
          onManualSaved={handleManualSaved}
          onRemoved={handleRemoved}
        />
      )}
    </div>
  );
}
