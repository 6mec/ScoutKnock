"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { CreateDemoButton } from "@/components/demos/create-demo-button";
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
import { Switch } from "@/components/ui/switch";
import {
  getContactHistory,
  removeContact,
  saveContactDetails,
  saveManualCompany,
} from "@/lib/contacts/actions";
import type { ContactEvent } from "@/lib/contacts/crm";
import type {
  ContactCompany,
  ContactCompanyEvent,
} from "@/lib/contacts/company-events";
import type { SiteCheckStatus } from "@/lib/radar/search-events";
import {
  companyFromManual,
  isManualCompanyId,
  manualCompanyOf,
  type ManualCompany,
} from "@/lib/contacts/manual";
import { scoreCompany } from "@/lib/radar/score";
import { SERVICE_IDS } from "@/lib/radar/types";
import { readNdjson } from "@/lib/read-ndjson";
import {
  MAX_CONFIRMED_CONTACT,
  MAX_LABEL,
  MAX_NEXT_ACTION,
  MAX_NOTES,
  parseDealValue,
  type Contact,
  type ContactDetails,
  type ContactStatus,
} from "@/lib/contacts/rules";
import { FollowUpButton } from "./follow-up-button";
import {
  ManualCompanyFields,
  manualFormOf,
  manualInput,
  parseManualForm,
  type ManualForm,
} from "./manual-company-fields";
import { StatusMenu } from "./status-menu";

const { contacts: copy } = ptPT;
const dateTimeFormat = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "medium",
  timeZone: "Europe/Lisbon",
});
const historyFormat = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Lisbon",
});

// O valor guardado volta ao campo escrito à portuguesa ("1200,5").
function dealText(value: number | null) {
  return value === null ? "" : String(value).replace(".", ",");
}

// Lido da base de dados ao abrir: nunca é uma chamada paga. O estado muda o
// histórico, por isso volta a ler quando muda.
function HistorySection({ contactId, status }: { contactId: string; status: ContactStatus }) {
  const [events, setEvents] = useState<ContactEvent[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    getContactHistory(contactId).then((result) => {
      if (!active) return;
      if (result.ok) setEvents(result.events);
      else setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [contactId, status]);

  return (
    <section
      aria-labelledby="contact-history"
      data-testid="contact-history"
      className="flex flex-col gap-2"
    >
      <h3 id="contact-history" className="text-13 text-muted">
        {copy.crm.historyTitle}
      </h3>
      {failed ? (
        <p className="text-14 text-muted">{copy.crm.historyError}</p>
      ) : events === null ? (
        <Skeleton className="h-12 rounded-md" />
      ) : events.length === 0 ? (
        <p className="text-14 text-muted">{copy.crm.historyEmpty}</p>
      ) : (
        <ol className="flex flex-col gap-2 border-l border-border pl-4">
          {events.map((event, index) => (
            <li key={`${event.created_at}-${index}`} className="relative text-14">
              <span
                aria-hidden="true"
                className="absolute top-1.5 -left-[21px] size-2.5 rounded-pill border-2 border-surface bg-border-strong"
              />
              <span>
                {event.kind === "created"
                  ? copy.crm.historyCreated
                  : copy.crm.historyStatus(copy.statuses[event.status])}
              </span>
              <span className="type-number block text-13 text-muted">
                {historyFormat.format(new Date(event.created_at))}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

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

// Empresa adicionada à mão: os dados editam-se aqui e a nota muda enquanto se escreve.
function ManualCompanySection({
  contactId,
  companyId,
  form,
  onChange,
  onSaved,
}: {
  contactId: string;
  companyId: string;
  form: ManualForm;
  onChange: (form: ManualForm) => void;
  onSaved: (company: ManualCompany) => void;
}) {
  const [saving, startSaving] = useTransition();
  const [invalid, setInvalid] = useState(false);
  const parsed = parseManualForm(form);
  const manual = copy.manual;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!parsed) {
      setInvalid(true);
      return;
    }
    startSaving(async () => {
      const { ok } = await saveManualCompany(contactId, manualInput(form));
      if (ok) {
        onSaved(parsed);
        toast.success(manual.savedCompany);
      } else {
        toast.error(copy.errors.generic);
      }
    });
  }

  return (
    <section
      data-testid="contact-company"
      aria-label={manual.sectionTitle}
      className="flex flex-col gap-4 rounded-lg border border-border p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{manual.sectionTitle}</h3>
        <Badge variant="outline">{manual.badge}</Badge>
      </div>
      {parsed && (
        <ScoreBreakdown
          opportunity={scoreCompany(companyFromManual(companyId, parsed), SERVICE_IDS[0])}
        />
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <ManualCompanyFields
          form={form}
          onChange={(next) => {
            onChange(next);
            setInvalid(false);
          }}
        />
        <div aria-live="polite">
          {invalid && (
            <p role="alert" className="text-14 text-danger">
              {manual.invalid}
            </p>
          )}
        </div>
        <Button type="submit" variant="secondary" loading={saving} loadingText={copy.saving}>
          {manual.saveCompany}
        </Button>
      </form>
      <p className="text-13 text-muted">{manual.sectionNote}</p>
    </section>
  );
}

export function ContactDialog({
  contact,
  onClose,
  onStatusChange,
  onSaved,
  onManualSaved,
  onRemoved,
}: {
  contact: Contact;
  onClose: () => void;
  onStatusChange: (id: string, status: ContactStatus) => void;
  onSaved: (id: string, details: ContactDetails) => void;
  onManualSaved: (id: string, company: ManualCompany) => void;
  onRemoved: (id: string) => void;
}) {
  const isManual = isManualCompanyId(contact.company_id);
  const [manualForm, setManualForm] = useState(() =>
    manualFormOf(manualCompanyOf(contact)),
  );
  const savedManual = manualCompanyOf(contact);
  const [label, setLabel] = useState(contact.label);
  const [confirmedContact, setConfirmedContact] = useState(
    contact.confirmed_contact ?? "",
  );
  const [nextAction, setNextAction] = useState(contact.next_action ?? "");
  const [nextActionAt, setNextActionAt] = useState(contact.next_action_at ?? "");
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [dealValue, setDealValue] = useState(dealText(contact.deal_value));
  const [doNotContact, setDoNotContact] = useState(contact.do_not_contact);
  const dealInvalid = parseDealValue(dealValue) === undefined;
  // Os botões de mensagem seguem o que está guardado, não o interruptor por guardar.
  const blocked = contact.do_not_contact;
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
    // As manuais não têm nada a pedir: os dados são os do próprio contacto.
    if (isManual) return;
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
  }, [contact.id, isManual]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (dealInvalid) return;
    startSaving(async () => {
      const savedLabel = isManual ? savedManual.name : label;
      const { ok } = await saveContactDetails(contact.id, {
        label: savedLabel,
        confirmedContact,
        nextAction,
        nextActionAt,
        notes,
        dealValue,
        doNotContact,
      });

      if (ok) {
        onSaved(contact.id, {
          label: savedLabel.trim(),
          confirmedContact: confirmedContact.trim() || null,
          nextAction: nextAction.trim() || null,
          nextActionAt: nextActionAt || null,
          notes: notes.trim() || null,
          dealValue: parseDealValue(dealValue) ?? null,
          doNotContact,
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
      <DialogContent aria-describedby={undefined} className="max-w-lg gap-5 lg:max-w-240">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pr-10">
          <DialogTitle className="pr-0">{contact.label}</DialogTitle>
          <StatusMenu contact={contact} onChange={onStatusChange} />
          {contact.do_not_contact && <Badge variant="outline">{copy.crm.doNotContactBadge}</Badge>}
        </div>
        {/* No computador: a empresa à esquerda, o acompanhamento à direita. */}
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
        {isManual ? (
          <>
            <ManualCompanySection
              contactId={contact.id}
              companyId={contact.company_id}
              form={manualForm}
              onChange={setManualForm}
              onSaved={(saved) => onManualSaved(contact.id, saved)}
            />
            <div className="flex flex-wrap gap-3">
              {!blocked && (
                <GenerateMessageButton
                  source={{ kind: "contact", id: contact.id }}
                  companyName={savedManual.name}
                  phone={savedManual.phone}
                  variant="secondary"
                />
              )}
              <CreateDemoButton
                company={companyFromManual(contact.company_id, savedManual)}
                isSample={false}
                prefill
              />
            </div>
          </>
        ) : (
          <>
            <CompanySection company={company} siteCheck={siteCheck} />
            {found && !blocked && (
              <GenerateMessageButton
                source={{ kind: "contact", id: contact.id }}
                companyName={found.name}
                phone={found.phone}
                variant="secondary"
              />
            )}
          </>
        )}
        {blocked ? (
          <p role="status" className="rounded-md border border-border p-3 text-14 text-muted">
            {copy.crm.doNotContactNote}
          </p>
        ) : (
          <FollowUpButton
            contact={contact}
            phone={isManual ? savedManual.phone : found?.phone}
          />
        )}
        </div>
        <div className="flex min-w-0 flex-col gap-4 lg:rounded-lg lg:border lg:border-border-subtle lg:bg-surface-raised/30 lg:p-4">
        <dl>
          <dt className="text-13 text-muted">{copy.details.lastContact}</dt>
          <dd>
            {contact.last_contacted_at
              ? dateTimeFormat.format(new Date(contact.last_contacted_at))
              : copy.details.noContactYet}
          </dd>
        </dl>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isManual && (
            <Field label={copy.details.label}>
              <Input
                value={label}
                maxLength={MAX_LABEL}
                required
                onChange={(event) => setLabel(event.target.value)}
              />
            </Field>
          )}
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
          <Field
            label={copy.crm.dealValue}
            help={copy.crm.dealValueHelp}
            error={dealInvalid ? copy.crm.dealValueInvalid : undefined}
            className="max-w-60"
          >
            <Input
              inputMode="decimal"
              value={dealValue}
              placeholder="0"
              onChange={(event) => setDealValue(event.target.value)}
            />
          </Field>
          <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
            <label htmlFor={`dnc-${contact.id}`} className="flex flex-col gap-1">
              <span className="text-14 font-medium">{copy.crm.doNotContact}</span>
              <span className="text-13 text-muted">{copy.crm.doNotContactHelp}</span>
            </label>
            <Switch
              id={`dnc-${contact.id}`}
              checked={doNotContact}
              onCheckedChange={setDoNotContact}
            />
          </div>
          <Button type="submit" loading={saving} loadingText={copy.saving}>
            {copy.save}
          </Button>
        </form>
        <HistorySection contactId={contact.id} status={contact.status} />
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
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
