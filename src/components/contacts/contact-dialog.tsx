"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ContactScore } from "@/components/contacts/score-summary";
import { GenerateMessageButton } from "@/components/messages/generate-message-button";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import {
  removeContact,
  saveContactDetails,
} from "@/lib/contacts/actions";
import {
  MAX_NEXT_ACTION,
  MAX_NOTES,
  type Contact,
  type ContactDetails,
  type ContactStatus,
} from "@/lib/contacts/rules";
import { StatusMenu } from "./status-menu";

const { contacts: copy } = ptPT;
const dateTimeFormat = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "medium",
  timeZone: "Europe/Lisbon",
});

export function ContactDialog({
  contact,
  onClose,
  onStatusChange,
  onSaved,
  onRemoved,
}: {
  contact: Contact;
  onClose: () => void;
  onStatusChange: (id: string, status: ContactStatus) => void;
  onSaved: (id: string, details: ContactDetails) => void;
  onRemoved: (id: string) => void;
}) {
  const [nextAction, setNextAction] = useState(contact.next_action ?? "");
  const [nextActionAt, setNextActionAt] = useState(contact.next_action_at ?? "");
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [saving, startSaving] = useTransition();
  const [removing, startRemoving] = useTransition();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startSaving(async () => {
      const { ok } = await saveContactDetails(contact.id, {
        nextAction,
        nextActionAt,
        notes,
      });

      if (ok) {
        onSaved(contact.id, {
          nextAction: nextAction.trim() || null,
          nextActionAt: nextActionAt || null,
          notes: notes.trim() || null,
        });
        toast.success(copy.saved);
      } else {
        toast.error(copy.errors.generic);
      }
    });
  }

  function handleRemove() {
    startRemoving(async () => {
      const { ok } = await removeContact(contact.id);

      if (ok) onRemoved(contact.id);
      else toast.error(copy.errors.generic);
    });
  }

  const rows: [string, string][] = [
    [copy.details.address, contact.address],
    ...(contact.phone
      ? ([[copy.details.phone, contact.phone]] as [string, string][])
      : []),
    [
      copy.details.lastContact,
      contact.last_contacted_at
        ? dateTimeFormat.format(new Date(contact.last_contacted_at))
        : copy.details.noContactYet,
    ],
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined} className="max-w-lg">
        <DialogTitle>{contact.company_name}</DialogTitle>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ContactScore score={contact.score} />
          <StatusMenu contact={contact} onChange={onStatusChange} />
        </div>
        <GenerateMessageButton
          source={{ kind: "contact", id: contact.id }}
          companyName={contact.company_name}
          phone={contact.phone}
          variant="secondary"
        />
        <dl className="flex flex-col gap-3">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-13 text-muted">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label={copy.details.nextAction}>
            <Input
              value={nextAction}
              maxLength={MAX_NEXT_ACTION}
              onChange={(event) => setNextAction(event.target.value)}
            />
          </Field>
          <Field label={copy.details.date}>
            <Input
              type="date"
              value={nextActionAt}
              onChange={(event) => setNextActionAt(event.target.value)}
            />
          </Field>
          <Field label={copy.details.notes}>
            <Textarea
              value={notes}
              maxLength={MAX_NOTES}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>
          <Button type="submit" loading={saving} loadingText={copy.saving}>
            {copy.save}
          </Button>
        </form>
        {confirmingRemoval ? (
          <div className="flex flex-col gap-3 rounded-md border border-danger p-4">
            <p>{copy.removeWarning}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger"
                loading={removing}
                loadingText={copy.saving}
                onClick={handleRemove}
              >
                {copy.removeConfirm}
              </Button>
              <Button variant="secondary" onClick={() => setConfirmingRemoval(false)}>
                {copy.removeCancel}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={() => setConfirmingRemoval(true)}
            className="self-start"
          >
            {copy.remove}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
