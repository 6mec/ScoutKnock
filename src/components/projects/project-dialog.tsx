"use client";

import { CircleAlert, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { createProject, deleteProject, updateProject } from "@/lib/projects/actions";
import type { ProjectPayment } from "@/lib/projects/payments";
import { ProjectPayments } from "./project-payments";
import { ProjectPortfolio } from "./project-portfolio";
import {
  MAX_PROJECT_COMPANY,
  MAX_PROJECT_LINK,
  MAX_PROJECT_NAME,
  MAX_PROJECT_NOTES,
  MAX_THIRD_PARTY_NOTE,
  PROJECT_KINDS,
  PROJECT_STATUSES,
  valueForInput,
  type ClientProject,
  type ProjectEvent,
  type ProjectKind,
  type ProjectStatus,
} from "@/lib/projects/rules";

const { projects: copy } = ptPT;
const dateFormat = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Lisbon",
});

type Form = {
  companyName: string;
  contactId: string;
  name: string;
  kind: ProjectKind;
  status: ProjectStatus;
  buildValue: string;
  thirdPartyValue: string;
  thirdPartyNote: string;
  maintenanceMonthly: string;
  startDate: string;
  dueDate: string;
  deliveredOn: string;
  maintenanceSince: string;
  link: string;
  notes: string;
};

export type ProjectDraft = {
  companyName?: string;
  contactId?: string | null;
  workRequestId?: string | null;
  name?: string;
  kind?: ProjectKind;
  notes?: string;
};

function formFrom(project: ClientProject | null, draft: ProjectDraft): Form {
  return {
    companyName: project?.company_name ?? draft.companyName ?? "",
    contactId: project?.contact_id ?? draft.contactId ?? "",
    name: project?.name ?? draft.name ?? "",
    kind: project?.kind ?? draft.kind ?? "site",
    status: project?.status ?? "requested",
    buildValue: valueForInput(project?.build_value ?? null),
    thirdPartyValue: valueForInput(project?.third_party_value ?? null),
    thirdPartyNote: project?.third_party_note ?? "",
    maintenanceMonthly: valueForInput(project?.maintenance_monthly ?? null),
    startDate: project?.start_date ?? "",
    dueDate: project?.due_date ?? "",
    deliveredOn: project?.delivered_on ?? "",
    maintenanceSince: project?.maintenance_since ?? "",
    link: project?.link ?? "",
    notes: project?.notes ?? draft.notes ?? "",
  };
}

// Aviso curto por baixo da ligação e das notas.
function SecretNote({ personal = false }: { personal?: boolean }) {
  return (
    <span className="flex items-start gap-1.5 text-amber">
      <ShieldAlert aria-hidden="true" size={15} className="mt-0.5 shrink-0" />
      <span>
        {copy.fields.noSecrets}
        {personal && ` ${copy.fields.noPersonal}`}
      </span>
    </span>
  );
}

// Criar (sem `project`) ou editar um projeto. Com `contacts`, ao criar, escolhe-se a ficha.
export function ProjectDialog({
  project = null,
  draft = {},
  events = [],
  payments = [],
  today,
  contacts,
  trigger,
  defaultOpen = false,
}: {
  project?: ClientProject | null;
  draft?: ProjectDraft;
  events?: ProjectEvent[];
  // Pagamentos recebidos (de todos os projetos) e o dia de hoje, para a secção de pagamentos.
  payments?: ProjectPayment[];
  today?: string;
  contacts?: { id: string; label: string }[];
  trigger: ReactNode;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [form, setForm] = useState<Form>(() => formFrom(project, draft));
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const editing = Boolean(project);
  const pickContact = !editing && contacts && !draft.contactId;

  function openChange(next: boolean) {
    if (next) {
      setForm(formFrom(project, draft));
      setError(null);
      setConfirming(false);
    }
    setOpen(next);
  }

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function chooseContact(id: string) {
    const label = contacts?.find((contact) => contact.id === id)?.label;
    setForm((current) => ({
      ...current,
      contactId: id,
      companyName: label && !current.companyName.trim() ? label : current.companyName,
    }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = project
        ? await updateProject(project.id, form)
        : await createProject({
            ...form,
            contactId: form.contactId || null,
            workRequestId: draft.workRequestId ?? null,
          });
      if (result.ok) {
        toast.success(project ? copy.saved : copy.created);
        setOpen(false);
        router.refresh();
      } else {
        setError(copy.errors[result.error]);
      }
    });
  }

  function handleDelete() {
    if (!project) return;
    startTransition(async () => {
      const { ok } = await deleteProject(project.id);
      if (ok) {
        toast.success(copy.removed);
        setOpen(false);
        router.refresh();
      } else {
        setError(copy.errors.generic);
      }
    });
  }

  const history = events
    .filter((item) => item.project_id === project?.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl" data-testid="project-dialog">
        <DialogTitle>{project ? copy.editTitle(project.name) : copy.createTitle}</DialogTitle>
        <DialogDescription>{copy.createBody}</DialogDescription>
        {draft.workRequestId && !editing && <p className="text-13 text-muted">{copy.fromRequest}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            {pickContact && (
              <Field label={copy.fields.contact} className="sm:col-span-2">
                <Select value={form.contactId} onChange={(event) => chooseContact(event.target.value)}>
                  <option value="">{copy.fields.noContact}</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.label}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label={copy.fields.company}>
              <Input
                name="companyName"
                value={form.companyName}
                maxLength={MAX_PROJECT_COMPANY}
                required
                onChange={(event) => set("companyName", event.target.value)}
              />
            </Field>
            <Field label={copy.fields.name}>
              <Input
                name="name"
                value={form.name}
                maxLength={MAX_PROJECT_NAME}
                required
                placeholder={copy.fields.namePlaceholder}
                onChange={(event) => set("name", event.target.value)}
              />
            </Field>
            <Field label={copy.fields.kind}>
              <Select name="kind" value={form.kind} onChange={(event) => set("kind", event.target.value as ProjectKind)}>
                {PROJECT_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {copy.kinds[kind]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={copy.fields.status}>
              <Select
                name="status"
                value={form.status}
                onChange={(event) => set("status", event.target.value as ProjectStatus)}
              >
                {PROJECT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {copy.statuses[status]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-15 font-semibold">{copy.fields.values}</legend>
            <p className="text-13 text-muted">{copy.fields.valuesHelp}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={copy.fields.build}>
                <Input
                  name="buildValue"
                  inputMode="decimal"
                  value={form.buildValue}
                  placeholder="0,00 €"
                  onChange={(event) => set("buildValue", event.target.value)}
                />
              </Field>
              <Field label={copy.fields.thirdParty} help={copy.fields.thirdPartyHelp}>
                <Input
                  name="thirdPartyValue"
                  inputMode="decimal"
                  value={form.thirdPartyValue}
                  placeholder="0,00 €"
                  onChange={(event) => set("thirdPartyValue", event.target.value)}
                />
              </Field>
              <Field label={copy.fields.maintenance}>
                <Input
                  name="maintenanceMonthly"
                  inputMode="decimal"
                  value={form.maintenanceMonthly}
                  placeholder="0,00 €"
                  onChange={(event) => set("maintenanceMonthly", event.target.value)}
                />
              </Field>
            </div>
            <Field label={copy.fields.thirdPartyNote}>
              <Input
                name="thirdPartyNote"
                value={form.thirdPartyNote}
                maxLength={MAX_THIRD_PARTY_NOTE}
                placeholder={copy.fields.thirdPartyNotePlaceholder}
                onChange={(event) => set("thirdPartyNote", event.target.value)}
              />
            </Field>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-15 font-semibold">{copy.fields.dates}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={copy.fields.start}>
                <Input type="date" name="startDate" value={form.startDate} onChange={(event) => set("startDate", event.target.value)} />
              </Field>
              <Field label={copy.fields.due}>
                <Input type="date" name="dueDate" value={form.dueDate} onChange={(event) => set("dueDate", event.target.value)} />
              </Field>
              <Field label={copy.fields.delivered}>
                <Input
                  type="date"
                  name="deliveredOn"
                  value={form.deliveredOn}
                  onChange={(event) => set("deliveredOn", event.target.value)}
                />
              </Field>
              <Field label={copy.fields.maintenanceSince}>
                <Input
                  type="date"
                  name="maintenanceSince"
                  value={form.maintenanceSince}
                  onChange={(event) => set("maintenanceSince", event.target.value)}
                />
              </Field>
            </div>
          </fieldset>

          <Field label={copy.fields.link} help={<SecretNote />}>
            <Input
              name="link"
              value={form.link}
              maxLength={MAX_PROJECT_LINK}
              placeholder={copy.fields.linkPlaceholder}
              onChange={(event) => set("link", event.target.value)}
            />
          </Field>
          <Field label={copy.fields.notes} help={<SecretNote personal />}>
            <Textarea
              name="notes"
              value={form.notes}
              rows={5}
              maxLength={MAX_PROJECT_NOTES}
              onChange={(event) => set("notes", event.target.value)}
            />
          </Field>

          <div aria-live="polite">
            {error && (
              <p data-testid="project-error" className="flex items-start gap-2 text-14 text-danger">
                <CircleAlert aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" loading={pending} loadingText={copy.saving}>
              {project ? copy.save : copy.create}
            </Button>
            {project && !confirming && (
              <Button type="button" variant="ghost" onClick={() => setConfirming(true)}>
                {copy.remove}
              </Button>
            )}
          </div>
          {project && confirming && (
            <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-danger/30 bg-danger-soft p-3 text-14">
              <span className="flex-1">{copy.removeConfirm}</span>
              <Button type="button" variant="danger" size="sm" loading={pending} onClick={handleDelete}>
                {copy.remove}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                {copy.keep}
              </Button>
            </div>
          )}
        </form>

        {project && today && <ProjectPayments project={project} payments={payments} today={today} />}
        {project && <ProjectPortfolio project={project} />}

        {project && history.length > 0 && (
          <section aria-labelledby="project-history" className="flex flex-col gap-2 border-t border-border pt-4">
            <h3 id="project-history" className="text-15 font-semibold">
              {copy.history}
            </h3>
            <ol className="flex flex-col gap-1.5" data-testid="project-history">
              {history.map((item, index) => (
                <li key={`${item.created_at}-${index}`} className="flex flex-wrap justify-between gap-2 text-14">
                  <span>
                    {item.kind === "created"
                      ? copy.historyCreated(copy.statuses[item.status])
                      : copy.historyStatus(copy.statuses[item.status])}
                  </span>
                  <time dateTime={item.created_at} className="text-muted">
                    {dateFormat.format(new Date(item.created_at))}
                  </time>
                </li>
              ))}
            </ol>
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
