"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { GenerateMessageButton } from "@/components/messages/generate-message-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ScoreBreakdown } from "@/components/ui/score-breakdown";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { SiteCheckNote } from "@/components/radar/site-check-note";
import { removeContact, saveContactDetails } from "@/lib/contacts/actions";
import type {
  ContactCompany,
  ContactCompanyEvent,
} from "@/lib/contacts/company-events";
import type { SiteCheckStatus } from "@/lib/radar/search-events";
import { readNdjson } from "@/lib/read-ndjson";
import {
  MAX_CONFIRMED_CONTACT,
  MAX_LABEL,
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

function CompanySection({
  company,
  siteCheck,
}: {
  company: ContactCompany | null;
  siteCheck?: SiteCheckStatus;
}) {
  if (!company) {
    return (
      <div role="status" className="flex flex-col gap-2">
        <span className="sr-only">{copy.company.loading}</span>
        <Skeleton className="h-24 rounded-lg" />
      </div>
    );
  }

  if (company.status !== "ok") {
    return (
      <p role="status" className="rounded-md border border-border p-3 text-14 text-muted">
        {company.status === "limit" ? copy.company.limit : copy.company.unavailable}
      </p>
    );
  }

  const rows: [string, React.ReactNode][] = [
    [copy.company.name, company.name],
    [copy.details.address, company.address],
    ...(company.phone
      ? ([[copy.details.phone, company.phone]] as [string, string][])
      : []),
    [
      copy.company.website,
      company.website ? (
        <a
          href={company.website}
          target="_blank"
          rel="noreferrer noopener"
          className="focus-ring rounded-sm break-all text-accent underline"
        >
          {company.website}
        </a>
      ) : (
        copy.company.noWebsite
      ),
    ],
    [copy.company.reviews, company.reviewCount],
    [
      copy.company.hours,
      company.hasOpeningHours ? copy.company.hoursYes : copy.company.hoursNo,
    ],
  ];

  return (
    <section
      data-testid="contact-company"
      aria-label={copy.company.title}
      className="flex flex-col gap-3 rounded-lg border border-border p-4"
    >
      {company.isSample && (
        <Badge variant="amber" className="self-start">
          {ptPT.radar.sampleBadge}
        </Badge>
      )}
      <ScoreBreakdown opportunity={company.opportunity} />
      <div role="status">
        <SiteCheckNote status={siteCheck} />
      </div>
      <dl className="flex flex-col gap-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-13 text-muted">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {!company.isSample && (
        <p className="text-13 text-muted">{ptPT.radar.attribution}</p>
      )}
    </section>
  );
}

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
  const [label, setLabel] = useState(contact.label);
  const [confirmedContact, setConfirmedContact] = useState(
    contact.confirmed_contact ?? "",
  );
  const [nextAction, setNextAction] = useState(contact.next_action ?? "");
  const [nextActionAt, setNextActionAt] = useState(contact.next_action_at ?? "");
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [company, setCompany] = useState<ContactCompany | null>(null);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [saving, startSaving] = useTransition();
  const [removing, startRemoving] = useTransition();
  // Cada abertura é uma chamada paga: nunca repetir por o efeito correr outra vez.
  const requested = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const pendingAbort = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [siteCheck, setSiteCheck] = useState<SiteCheckStatus>();

  useEffect(() => {
    clearTimeout(pendingAbort.current);
    if (!requested.current) {
      requested.current = true;
      const current = new AbortController();
      controller.current = current;

      async function load() {
        const response = await fetch(`/api/contacts/${contact.id}/company`, {
          method: "POST",
          signal: current.signal,
        });
        if (!response.ok || !response.body) throw new Error("contacto");

        await readNdjson<ContactCompanyEvent>(response.body, (event) => {
          if (event.type === "company") setCompany(event.company);
          if (event.type === "site_start") setSiteCheck("checking");
          if (event.type === "site_done") {
            setSiteCheck(event.status);
            if (event.status === "checked") {
              const { opportunity } = event;
              setCompany((value) =>
                value?.status === "ok" ? { ...value, opportunity } : value,
              );
            }
          }
        });
      }

      load()
        .then(() => {
          setCompany((value) => value ?? { status: "unavailable" });
          setSiteCheck((value) => (value === "checking" ? "failed" : value));
        })
        .catch(() => {
          setCompany((value) => value ?? { status: "unavailable" });
          setSiteCheck((value) => (value === "checking" ? "failed" : value));
        });
    }

    // Adiado: em desenvolvimento o React corre os efeitos duas vezes, e a chamada é paga.
    return () => {
      pendingAbort.current = setTimeout(() => controller.current?.abort(), 0);
    };
  }, [contact.id]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startSaving(async () => {
      const { ok } = await saveContactDetails(contact.id, {
        label,
        confirmedContact,
        nextAction,
        nextActionAt,
        notes,
      });

      if (ok) {
        onSaved(contact.id, {
          label: label.trim(),
          confirmedContact: confirmedContact.trim() || null,
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

  const found = company?.status === "ok" ? company : null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined} className="max-w-lg">
        <DialogTitle>{contact.label}</DialogTitle>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <StatusMenu contact={contact} onChange={onStatusChange} />
        </div>
        <CompanySection company={company} siteCheck={siteCheck} />
        {found && (
          <GenerateMessageButton
            source={{ kind: "contact", id: contact.id }}
            companyName={found.name}
            phone={found.phone}
            variant="secondary"
          />
        )}
        <dl>
          <dt className="text-13 text-muted">{copy.details.lastContact}</dt>
          <dd>
            {contact.last_contacted_at
              ? dateTimeFormat.format(new Date(contact.last_contacted_at))
              : copy.details.noContactYet}
          </dd>
        </dl>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label={copy.details.label}>
            <Input
              value={label}
              maxLength={MAX_LABEL}
              required
              onChange={(event) => setLabel(event.target.value)}
            />
          </Field>
          <Field label={copy.details.confirmedContact}>
            <Input
              value={confirmedContact}
              maxLength={MAX_CONFIRMED_CONTACT}
              onChange={(event) => setConfirmedContact(event.target.value)}
            />
          </Field>
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
