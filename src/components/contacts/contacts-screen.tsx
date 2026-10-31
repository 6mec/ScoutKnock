"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { setContactStatus } from "@/lib/contacts/actions";
import {
  marksLastContact,
  type Contact,
  type ContactDetails,
  type ContactStatus,
} from "@/lib/contacts/rules";
import { ContactDialog } from "./contact-dialog";
import { ContactsBoard } from "./contacts-board";
import { ContactsTable } from "./contacts-table";

const { contacts: copy } = ptPT;

export function ContactsScreen({ initial }: { initial: Contact[] }) {
  const [contacts, setContacts] = useState(initial);
  const [lastInitial, setLastInitial] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);

  // O Next guarda este ecrã escondido: ao voltar, os dados novos do servidor mandam.
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setContacts(initial);
  }

  const open = contacts.find(({ id }) => id === openId);

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
              next_action: details.nextAction,
              next_action_at: details.nextActionAt,
              notes: details.notes,
            }
          : contact,
      ),
    );
  }

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
            <Button asChild variant="secondary">
              <Link href="/painel/radar">{ptPT.app.commands.goRadar}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col px-4 py-6 lg:px-8">
      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">{copy.views.board}</TabsTrigger>
          <TabsTrigger value="table">{copy.views.table}</TabsTrigger>
        </TabsList>
        <TabsContent value="board">
          <ContactsBoard
            contacts={contacts}
            onOpen={setOpenId}
            onStatusChange={changeStatus}
          />
        </TabsContent>
        <TabsContent value="table">
          <ContactsTable
            contacts={contacts}
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
          onRemoved={handleRemoved}
        />
      )}
    </div>
  );
}
