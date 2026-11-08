"use client";

import { FileText, Handshake, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { deleteProposal, getContactProposals, saveProposal } from "@/lib/cycle/actions";
import type { ContactStatus } from "@/lib/contacts/rules";
import { MAX_PROPOSAL_SERVICE, PROPOSAL_STATUSES, isExpired, type Proposal, type ProposalStatus } from "@/lib/proposals/rules";

const copy = ptPT.contacts.proposals;
const money = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });
const dayFormat = new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeZone: "UTC" });
const day = (date: string) => dayFormat.format(new Date(`${date}T00:00:00Z`));
const BADGES: Record<ProposalStatus, BadgeVariant> = { draft: "outline", sent: "amber", accepted: "accent", refused: "neutral" };

type Form = { service: string; value: string; deposit: string; validUntil: string; status: ProposalStatus };
const empty: Form = { service: "", value: "", deposit: "", validUntil: "", status: "draft" };
const formOf = (proposal: Proposal): Form => ({
  service: proposal.service,
  value: String(proposal.value).replace(".", ","),
  deposit: proposal.deposit === null ? "" : String(proposal.deposit).replace(".", ","),
  validUntil: proposal.valid_until ?? "",
  status: proposal.status,
});

// Propostas na ficha do contacto: o registo que alimenta "Propostas abertas" e "Vendas do
// mês". Aceite (aqui ou com "Fechar negócio") cria o projeto com o valor e o sinal.
export function ProposalSection({
  contactId,
  contactStatus,
  today,
  onStatusChange,
}: {
  contactId: string;
  contactStatus: ContactStatus;
  today: string;
  onStatusChange: (id: string, status: ContactStatus) => void;
}) {
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;
    getContactProposals(contactId).then((result) => {
      if (alive) setProposals(result.ok ? result.proposals : []);
    });
    return () => {
      alive = false;
    };
  }, [contactId]);

  function reload() {
    getContactProposals(contactId).then((result) => setProposals(result.ok ? result.proposals : []));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveProposal(contactId, form, editing === "new" ? null : editing);
      if (!result.ok) {
        setError(copy.errors[result.error]);
        return;
      }
      toast.success(result.projectCreated ? ptPT.projects.cycle.created : copy.saved);
      setEditing(null);
      reload();
      // O servidor já mudou o contacto; isto põe o ecrã igual sem esperar.
      if (form.status === "accepted" && contactStatus !== "won") onStatusChange(contactId, "won");
      if (form.status === "sent" && ["to_contact", "contacted", "replied"].includes(contactStatus)) onStatusChange(contactId, "proposal");
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const { ok } = await deleteProposal(id);
      if (ok) {
        toast.success(copy.removed);
        reload();
      } else {
        toast.error(copy.errors.generic);
      }
    });
  }

  return (
    <section aria-labelledby={`propostas-${contactId}`} className="flex flex-col gap-3 rounded-lg border border-border-subtle p-3" data-testid="contact-proposals">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`propostas-${contactId}`} className="text-14 font-semibold">
          {copy.title}
        </h3>
        <div className="flex flex-wrap gap-2">
          {editing === null && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setForm(empty);
                setEditing("new");
              }}
            >
              <Plus aria-hidden="true" size={15} />
              {copy.add}
            </Button>
          )}
          {contactStatus !== "won" && (
            <Button type="button" size="sm" disabled={pending} onClick={() => onStatusChange(contactId, "won")} data-testid="close-deal">
              <Handshake aria-hidden="true" size={15} />
              {copy.closeDeal}
            </Button>
          )}
        </div>
      </div>

      {proposals === null ? (
        <p className="text-13 text-muted">{copy.loading}</p>
      ) : proposals.length === 0 && editing === null ? (
        <p className="text-13 text-muted">{copy.empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {proposals.map((proposal) =>
            editing === proposal.id ? null : (
              <li key={proposal.id} className="flex flex-col gap-1.5 rounded-md border border-border bg-surface px-3 py-2" data-testid="proposal-item">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-14 font-medium">{proposal.service}</span>
                  <Badge variant={BADGES[proposal.status]}>{copy.statuses[proposal.status]}</Badge>
                </div>
                <p className="text-13 text-muted">
                  {money.format(Number(proposal.value))}
                  {proposal.deposit !== null && Number(proposal.deposit) > 0 ? ` · ${copy.depositLine(money.format(Number(proposal.deposit)))}` : ""}
                  {proposal.valid_until ? ` · ${copy.validLine(day(proposal.valid_until))}` : ""}
                </p>
                {isExpired(proposal, today) && <p className="text-13 font-medium text-amber">{copy.expired}</p>}
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setForm(formOf(proposal));
                      setEditing(proposal.id);
                    }}
                  >
                    <Pencil aria-hidden="true" size={14} />
                    {copy.edit}
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/painel/contactos/${contactId}/proposta?proposta=${proposal.id}`}>
                      <FileText aria-hidden="true" size={14} />
                      {copy.document}
                    </Link>
                  </Button>
                  <Button type="button" variant="ghost" size="sm" disabled={pending} aria-label={copy.remove(proposal.service)} onClick={() => remove(proposal.id)}>
                    <Trash2 aria-hidden="true" size={14} />
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      {editing !== null && (
        <form onSubmit={submit} noValidate className="grid gap-3 rounded-md border border-border bg-surface p-3 sm:grid-cols-2" data-testid="proposal-form">
          <Field label={copy.service} className="sm:col-span-2">
            <Input
              value={form.service}
              maxLength={MAX_PROPOSAL_SERVICE}
              placeholder={copy.servicePlaceholder}
              onChange={(event) => setForm({ ...form, service: event.target.value })}
            />
          </Field>
          <Field label={copy.value}>
            <Input inputMode="decimal" placeholder="0,00 €" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} />
          </Field>
          <Field label={copy.deposit} help={copy.depositHelp}>
            <Input inputMode="decimal" placeholder="0,00 €" value={form.deposit} onChange={(event) => setForm({ ...form, deposit: event.target.value })} />
          </Field>
          <Field label={copy.validUntil}>
            <Input type="date" value={form.validUntil} onChange={(event) => setForm({ ...form, validUntil: event.target.value })} />
          </Field>
          <Field label={copy.status} help={form.status === "accepted" ? copy.acceptedHelp : undefined}>
            <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProposalStatus })}>
              {PROPOSAL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {copy.statuses[status]}
                </option>
              ))}
            </Select>
          </Field>
          {error && (
            <p role="alert" className="text-14 text-danger sm:col-span-2">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" loading={pending} loadingText={copy.saving}>
              {copy.save}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              {copy.cancel}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
