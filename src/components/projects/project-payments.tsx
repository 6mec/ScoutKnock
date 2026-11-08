"use client";

import { CircleAlert, CircleCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { markPaymentReceived } from "@/lib/cycle/actions";
import { addPayment, deletePayment } from "@/lib/projects/actions";
import {
  MAX_PAYMENT_NOTE,
  PAYMENT_KINDS,
  PAYMENT_STATUSES,
  isReceived,
  projectBalance,
  type PaymentKind,
  type PaymentStatus,
  type ProjectPayment,
} from "@/lib/projects/payments";
import type { ClientProject } from "@/lib/projects/rules";

const { projects: projectsCopy } = ptPT;
const copy = projectsCopy.payments;
const money = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });
const dayFormat = new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeZone: "UTC" });
const day = (date: string) => dayFormat.format(new Date(`${date}T00:00:00Z`));

// Secção do diálogo do projeto: os pagamentos previstos (sinal, final, manutenção), que se
// marcam como recebidos, e os recebidos. Formulário próprio, fora do formulário do projeto.
export function ProjectPayments({
  project,
  payments,
  today,
}: {
  project: Pick<ClientProject, "id" | "build_value">;
  payments: ProjectPayment[];
  today: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    amount: "",
    status: "received" as PaymentStatus,
    paidOn: today,
    dueOn: "",
    kind: "final" as PaymentKind,
    note: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const own = payments.filter((payment) => payment.project_id === project.id);
  const expected = own
    .filter((payment) => !isReceived(payment))
    .sort((a, b) => (a.due_on ?? "9999").localeCompare(b.due_on ?? "9999"));
  const received = own
    .filter(isReceived)
    .sort((a, b) => (b.paid_on ?? "").localeCompare(a.paid_on ?? "") || b.created_at.localeCompare(a.created_at));
  const balance = projectBalance(project, payments);

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addPayment({ projectId: project.id, ...form });
      if (result.ok) {
        toast.success(copy.added);
        setForm((current) => ({ ...current, amount: "", note: "", dueOn: "" }));
        router.refresh();
      } else {
        setError(copy.errors[result.error]);
      }
    });
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const { ok } = await deletePayment(id);
      if (ok) {
        toast.success(copy.removed);
        router.refresh();
      } else {
        setError(copy.errors.generic);
      }
    });
  }

  function receive(id: string) {
    setError(null);
    startTransition(async () => {
      const { ok } = await markPaymentReceived(id);
      if (ok) {
        toast.success(copy.marked);
        router.refresh();
      } else {
        setError(copy.errors.generic);
      }
    });
  }

  const row = (payment: ProjectPayment) => {
    const date = payment.paid_on ?? payment.due_on;
    return (
      <li key={payment.id} data-testid="payment-item" className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-14">
        <span className="min-w-0">
          <span className="font-semibold tabular-nums">{money.format(Number(payment.amount))}</span>
          <span className="text-muted">
            {" "}
            · {copy.kinds[payment.kind]}
            {isReceived(payment)
              ? payment.paid_on
                ? ` · ${day(payment.paid_on)}`
                : ""
              : ` · ${payment.due_on ? copy.dueLabel(day(payment.due_on)) : copy.noDue}`}
            {payment.note ? ` · ${payment.note}` : ""}
          </span>
        </span>
        <span className="flex items-center gap-1">
          {!isReceived(payment) && (
            <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => receive(payment.id)} data-testid="payment-receive">
              <CircleCheck aria-hidden="true" size={15} />
              {copy.markReceived}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            aria-label={copy.remove(money.format(Number(payment.amount)), date ? day(date) : copy.noDue)}
            onClick={() => remove(payment.id)}
          >
            <Trash2 aria-hidden="true" size={15} />
          </Button>
        </span>
      </li>
    );
  };

  return (
    <section aria-labelledby="project-payments" className="flex flex-col gap-3 border-t border-border pt-4" data-testid="project-payments">
      <h3 id="project-payments" className="text-15 font-semibold">
        {copy.title}
      </h3>
      <p className="text-13 text-muted">{copy.help}</p>
      <p className="text-14 font-medium" data-testid="project-balance">
        {balance.build > 0
          ? copy.balance(money.format(balance.paid), money.format(balance.build), money.format(balance.remaining))
          : copy.balanceNoBuild}
      </p>

      {own.length === 0 && <p className="text-14 text-muted">{copy.empty}</p>}
      {expected.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h4 className="text-13 font-semibold text-muted">{copy.expectedTitle}</h4>
          <ul className="flex flex-col gap-1.5" data-testid="payment-expected">
            {expected.map(row)}
          </ul>
        </div>
      )}
      {received.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h4 className="text-13 font-semibold text-muted">{copy.receivedTitle}</h4>
          <ul className="flex flex-col gap-1.5" data-testid="payment-list">
            {received.map(row)}
          </ul>
        </div>
      )}

      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3" noValidate data-testid="payment-form">
        <Field label={copy.amount}>
          <Input
            name="amount"
            inputMode="decimal"
            placeholder="0,00 €"
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: event.target.value })}
          />
        </Field>
        <Field label={copy.kind}>
          <Select name="kind" value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as PaymentKind })}>
            {PAYMENT_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {copy.kinds[kind]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={copy.status}>
          <Select name="status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PaymentStatus })}>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {copy.statuses[status]}
              </option>
            ))}
          </Select>
        </Field>
        {form.status === "received" ? (
          <Field label={copy.date}>
            <Input type="date" name="paidOn" max={today} value={form.paidOn} onChange={(event) => setForm({ ...form, paidOn: event.target.value })} />
          </Field>
        ) : (
          <Field label={copy.dueOn}>
            <Input type="date" name="dueOn" value={form.dueOn} onChange={(event) => setForm({ ...form, dueOn: event.target.value })} />
          </Field>
        )}
        <Field label={copy.note} className="sm:col-span-2">
          <Input
            name="paymentNote"
            maxLength={MAX_PAYMENT_NOTE}
            placeholder={copy.notePlaceholder}
            value={form.note}
            onChange={(event) => setForm({ ...form, note: event.target.value })}
          />
        </Field>
        <div aria-live="polite" className="sm:col-span-3">
          {error && (
            <p data-testid="payment-error" className="flex items-start gap-2 text-14 text-danger">
              <CircleAlert aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
        </div>
        <div className="sm:col-span-3">
          <Button type="submit" variant="secondary" loading={pending} loadingText={copy.adding}>
            {copy.add}
          </Button>
        </div>
      </form>
    </section>
  );
}
