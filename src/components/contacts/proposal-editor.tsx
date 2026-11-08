"use client";

import { Plus, Printer, Save, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { saveProposalTotal } from "@/lib/contacts/actions";
import {
  MAX_PROPOSAL_ITEMS,
  proposalLines,
  validityDays,
  validUntil,
  type ProposalForm,
} from "@/lib/contacts/proposal";
import { parseDealValue } from "@/lib/contacts/rules";

const copy = ptPT.proposal;
const SENDER_KEY = "scoutknock-proposal-sender";
const money = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });
const longDate = new Intl.DateTimeFormat("pt-PT", { dateStyle: "long", timeZone: "Europe/Lisbon" });

// O nome e o contacto do freelancer ficam só neste browser: é uma conveniência.
function readSender(): { yourName?: string; yourContact?: string } {
  try {
    return JSON.parse(localStorage.getItem(SENDER_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeSender(yourName: string, yourContact: string) {
  try {
    localStorage.setItem(SENDER_KEY, JSON.stringify({ yourName, yourContact }));
  } catch {
    return;
  }
}

function Document({ form, now }: { form: ProposalForm; now: number }) {
  const { lines, total } = proposalLines(form.items);
  const monthly = parseDealValue(form.monthlyValue);
  const doc = copy.doc;

  return (
    <article
      data-testid="proposal-document"
      className="mx-auto w-full max-w-[210mm] rounded-md bg-white p-8 text-14 leading-relaxed text-[#0b0f14] shadow-float print:max-w-none print:rounded-none print:p-0 print:shadow-none sm:p-12"
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e3e8ee] pb-6">
        <div>
          <p className="text-12 font-semibold tracking-[0.08em] text-[#0a7f5b] uppercase">{doc.heading}</p>
          <h1 className="mt-2 text-24 font-bold tracking-tight">{form.clientName || "—"}</h1>
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-13">
          <dt className="text-[#566273]">{doc.date}</dt>
          <dd>{longDate.format(new Date(now))}</dd>
          <dt className="text-[#566273]">{doc.validUntil}</dt>
          <dd>{longDate.format(validUntil(now, validityDays(form.validityDays)))}</dd>
        </dl>
      </header>

      <div className="grid gap-4 border-b border-[#e3e8ee] py-6 sm:grid-cols-2">
        <div>
          <p className="text-12 text-[#566273]">{doc.from}</p>
          <p className="font-semibold">{form.yourName || "—"}</p>
          {form.yourContact && <p>{form.yourContact}</p>}
        </div>
        <div>
          <p className="text-12 text-[#566273]">{doc.to}</p>
          <p className="font-semibold">{form.clientName || "—"}</p>
        </div>
      </div>

      {lines.length === 0 ? (
        <p className="py-6 text-[#566273]">{doc.empty}</p>
      ) : (
        <table className="my-6 w-full text-left">
          <thead>
            <tr className="border-b border-[#e3e8ee] text-12 text-[#566273]">
              <th scope="col" className="py-2 font-medium">{doc.service}</th>
              <th scope="col" className="py-2 text-right font-medium">{doc.value}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={index} className="border-b border-[#edf0f4]">
                <td className="py-3 pr-4">{line.description}</td>
                <td className="py-3 text-right tabular-nums">{money.format(line.price)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="pt-4 text-left font-semibold">{doc.total}</th>
              <td data-testid="proposal-total" className="pt-4 text-right text-18 font-bold tabular-nums">
                {money.format(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      )}

      {monthly ? (
        <section className="rounded-md bg-[#f1f4f8] p-4">
          <p className="flex justify-between gap-4 font-semibold">
            <span>{doc.monthly}</span>
            <span className="tabular-nums">{doc.perMonth(money.format(monthly))}</span>
          </p>
          {form.monthlyDescription && <p className="mt-1 text-13 text-[#566273]">{form.monthlyDescription}</p>}
        </section>
      ) : null}

      {(form.delivery || form.notes) && (
        <dl className="mt-6 flex flex-col gap-4">
          {form.delivery && (
            <div>
              <dt className="text-12 text-[#566273]">{doc.delivery}</dt>
              <dd>{form.delivery}</dd>
            </div>
          )}
          {form.notes && (
            <div>
              <dt className="text-12 text-[#566273]">{doc.notes}</dt>
              <dd className="whitespace-pre-line">{form.notes}</dd>
            </div>
          )}
        </dl>
      )}
    </article>
  );
}

export function ProposalEditor({
  contactId,
  clientName,
  dealValue,
  yourName,
  yourContact,
  registered = null,
}: {
  contactId: string;
  clientName: string;
  dealValue: number | null;
  yourName: string;
  yourContact: string;
  // A proposta registada na ficha, para o documento não ser escrito outra vez.
  registered?: { service: string; value: number; validDays: number | null } | null;
}) {
  const [now] = useState(() => Date.now());
  const [form, setForm] = useState<ProposalForm>({
    yourName,
    yourContact,
    clientName,
    items: [
      {
        description: registered?.service ?? copy.defaultItem,
        price: registered ? String(registered.value).replace(".", ",") : dealValue === null ? "" : String(dealValue).replace(".", ","),
      },
    ],
    monthlyValue: "",
    monthlyDescription: "",
    delivery: "",
    validityDays: registered?.validDays ? String(registered.validDays) : "15",
    notes: "",
  });
  const [saving, startSaving] = useTransition();
  const { total, invalid } = proposalLines(form.items);
  const monthlyInvalid = parseDealValue(form.monthlyValue) === undefined;

  // O que ficou guardado neste browser só preenche o que vier vazio.
  useEffect(() => {
    const saved = readSender();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- o browser só se lê depois de montar
    setForm((current) => ({
      ...current,
      yourName: current.yourName || saved.yourName || "",
      yourContact: current.yourContact || saved.yourContact || "",
    }));
  }, []);

  function update(values: Partial<ProposalForm>) {
    setForm((current) => ({ ...current, ...values }));
  }

  function updateItem(index: number, values: Partial<ProposalForm["items"][number]>) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, i) => (i === index ? { ...item, ...values } : item)),
    }));
  }

  function saveTotal() {
    startSaving(async () => {
      const { ok } = await saveProposalTotal(contactId, total);
      if (ok) toast.success(copy.savedTotal);
      else toast.error(ptPT.contacts.errors.generic);
    });
  }

  return (
    <div className="grid w-full gap-6 px-4 pt-4 pb-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:px-8 print:block print:p-0">
      <div className="flex min-w-0 flex-col gap-4 print:hidden">
        <h3 className="text-15 font-semibold">{copy.pageTitle(clientName)}</h3>

        <section aria-labelledby="proposta-dados" className="panel flex flex-col gap-4 p-5">
          <h3 id="proposta-dados" className="text-14 font-semibold">{copy.you}</h3>
          <Field label={copy.yourName} help={form.yourName.trim() ? undefined : copy.yourNameHelp}>
            <Input
              value={form.yourName}
              maxLength={80}
              onChange={(event) => update({ yourName: event.target.value })}
              onBlur={() => writeSender(form.yourName, form.yourContact)}
            />
          </Field>
          <Field label={copy.yourContact} help={copy.rememberNote}>
            <Input
              value={form.yourContact}
              maxLength={120}
              onChange={(event) => update({ yourContact: event.target.value })}
              onBlur={() => writeSender(form.yourName, form.yourContact)}
            />
          </Field>
          <Field label={copy.clientName}>
            <Input
              value={form.clientName}
              maxLength={120}
              onChange={(event) => update({ clientName: event.target.value })}
            />
          </Field>
        </section>

        <section aria-labelledby="proposta-servicos" className="panel flex flex-col gap-4 p-5">
          <h3 id="proposta-servicos" className="text-14 font-semibold">{copy.items}</h3>
          {form.items.map((item, index) => (
            <div key={index} className="grid grid-cols-[minmax(0,1fr)_7.5rem_auto] items-end gap-2">
              <Field
                label={
                  <>
                    {copy.itemDescription}
                    <span className="sr-only">{copy.itemNumber(index + 1)}</span>
                  </>
                }
              >
                <Input
                  value={item.description}
                  maxLength={160}
                  placeholder={copy.itemPlaceholder}
                  onChange={(event) => updateItem(index, { description: event.target.value })}
                />
              </Field>
              <Field
                label={
                  <>
                    {copy.itemPrice}
                    <span className="sr-only">{copy.itemNumber(index + 1)}</span>
                  </>
                }
                error={invalid.has(index) ? copy.invalidPrice : undefined}
              >
                <Input
                  inputMode="decimal"
                  value={item.price}
                  placeholder="0"
                  onChange={(event) => updateItem(index, { price: event.target.value })}
                />
              </Field>
              <Button
                variant="ghost"
                aria-label={copy.removeItem(index + 1)}
                disabled={form.items.length === 1}
                onClick={() => update({ items: form.items.filter((_, i) => i !== index) })}
                className="mb-0.5 px-3"
              >
                <Trash2 aria-hidden="true" size={16} strokeWidth={1.75} />
              </Button>
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            disabled={form.items.length >= MAX_PROPOSAL_ITEMS}
            onClick={() => update({ items: [...form.items, { description: "", price: "" }] })}
          >
            <Plus aria-hidden="true" size={16} strokeWidth={1.75} />
            {copy.addItem}
          </Button>
        </section>

        <section aria-labelledby="proposta-condicoes" className="panel flex flex-col gap-4 p-5">
          <h3 id="proposta-condicoes" className="text-14 font-semibold">{copy.monthly}</h3>
          <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <Field label={copy.monthlyValue} error={monthlyInvalid ? copy.invalidPrice : undefined}>
              <Input
                inputMode="decimal"
                value={form.monthlyValue}
                placeholder="0"
                onChange={(event) => update({ monthlyValue: event.target.value })}
              />
            </Field>
            <Field label={copy.monthlyDescription}>
              <Input
                value={form.monthlyDescription}
                maxLength={160}
                placeholder={copy.monthlyPlaceholder}
                onChange={(event) => update({ monthlyDescription: event.target.value })}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <Field label={copy.delivery}>
              <Input
                value={form.delivery}
                maxLength={160}
                placeholder={copy.deliveryPlaceholder}
                onChange={(event) => update({ delivery: event.target.value })}
              />
            </Field>
            <Field label={copy.validity}>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={365}
                value={form.validityDays}
                onChange={(event) => update({ validityDays: event.target.value })}
              />
            </Field>
          </div>
          <Field label={copy.notes}>
            <Textarea
              value={form.notes}
              maxLength={1000}
              placeholder={copy.notesPlaceholder}
              onChange={(event) => update({ notes: event.target.value })}
            />
          </Field>
        </section>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => window.print()}>
            <Printer aria-hidden="true" size={16} strokeWidth={1.75} />
            {copy.print}
          </Button>
          <Button
            variant="secondary"
            loading={saving}
            loadingText={ptPT.contacts.saving}
            disabled={total <= 0}
            onClick={saveTotal}
          >
            <Save aria-hidden="true" size={16} strokeWidth={1.75} />
            {copy.saveTotal}
          </Button>
        </div>
      </div>

      <div className="min-w-0 lg:sticky lg:top-24 lg:self-start print:static">
        <Document form={form} now={now} />
      </div>
    </div>
  );
}
