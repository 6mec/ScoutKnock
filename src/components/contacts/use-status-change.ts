"use client";

import type { Dispatch, SetStateAction } from "react";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { setContactStatus } from "@/lib/contacts/actions";
import type { ContactEvent } from "@/lib/contacts/crm";
import { marksLastContact, type Contact, type ContactStatus } from "@/lib/contacts/rules";

// Muda o estado de um contacto logo no ecrã e grava; se o servidor recusar, volta atrás.
// Usado nos Contactos e no Dashboard (fila e "Chamar no WhatsApp").
export function useStatusChange(
  contacts: Contact[],
  setContacts: Dispatch<SetStateAction<Contact[]>>,
  events: ContactEvent[],
  setEvents: Dispatch<SetStateAction<ContactEvent[]>>,
) {
  return function changeStatus(id: string, status: ContactStatus) {
    const previous = contacts;
    const previousEvents = events;
    const current = contacts.find((contact) => contact.id === id);
    if (!current || current.status === status) return;
    const at = new Date().toISOString();

    setContacts((list) =>
      list.map((contact) =>
        contact.id === id
          ? {
              ...contact,
              status,
              last_contacted_at: marksLastContact(status) ? at : contact.last_contacted_at,
            }
          : contact,
      ),
    );
    // O mesmo que o gatilho da base de dados grava, para a meta e o ritmo mudarem já.
    setEvents((list) => [...list, { contact_id: id, kind: "status", status, created_at: at }]);

    setContactStatus(id, status).then(({ ok }) => {
      if (!ok) {
        setContacts(previous);
        setEvents(previousEvents);
        toast.error(ptPT.contacts.errors.generic);
      }
    });
  };
}
