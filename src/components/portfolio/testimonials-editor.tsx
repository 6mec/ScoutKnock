"use client";

import { MessageSquareQuote, Plus } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PanelHeader } from "@/components/ui/panel-header";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { deleteTestimonial, saveTestimonial } from "@/lib/portfolio/actions";
import { LIMITS } from "@/lib/portfolio/rules";

const copy = ptPT.portfolio.testimonials;

export type TestimonialRow = {
  id: string | null;
  first_name: string;
  company: string;
  quote: string;
  authorized: boolean;
  project_id: string | null;
};

// Cada opinião guarda-se à parte. Só as marcadas como autorizadas saem na página.
function TestimonialForm({
  row,
  index,
  projects,
  onSaved,
  onRemoved,
}: {
  row: TestimonialRow;
  index: number;
  projects: { id: string; company_name: string }[];
  onSaved: (row: TestimonialRow) => void;
  onRemoved: () => void;
}) {
  const [form, setForm] = useState(row);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const n = index + 1;

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveTestimonial(form.id, {
        firstName: form.first_name,
        company: form.company,
        quote: form.quote,
        authorized: form.authorized,
        projectId: form.project_id,
      });
      if (result.ok) {
        const firstName = form.first_name.trim().split(/\s+/)[0];
        setForm({ ...form, id: result.id, first_name: firstName });
        onSaved({ ...form, id: result.id, first_name: firstName });
        toast.success(copy.saved);
      } else {
        setError(copy.errors[result.error]);
      }
    });
  }

  function remove() {
    if (!form.id) {
      onRemoved();
      return;
    }
    startTransition(async () => {
      const { ok } = await deleteTestimonial(form.id as string);
      if (ok) {
        toast.success(copy.removed);
        onRemoved();
      } else {
        setError(copy.errors.generic);
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate className="panel-row flex flex-col gap-3 p-3" data-testid="testimonial-form">
      {!form.authorized && (
        <Badge variant="outline" className="self-start">
          {copy.draftNote}
        </Badge>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={`${copy.firstName} ${n}`}>
          <Input name="firstName" value={form.first_name} maxLength={LIMITS.firstName} onChange={(event) => setForm({ ...form, first_name: event.target.value })} />
        </Field>
        <Field label={`${copy.company} ${n}`}>
          <Input name="company" value={form.company} maxLength={LIMITS.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
        </Field>
      </div>
      <Field label={`${copy.quote} ${n}`}>
        <Textarea name="quote" value={form.quote} maxLength={LIMITS.quote} rows={3} onChange={(event) => setForm({ ...form, quote: event.target.value })} />
      </Field>
      {projects.length > 0 && (
        <Field label={`${copy.project} ${n}`}>
          <Select value={form.project_id ?? ""} onChange={(event) => setForm({ ...form, project_id: event.target.value || null })}>
            <option value="">{copy.noProject}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.company_name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={`testimonial-auth-${index}`} className="text-14 font-medium">
          {copy.authorized}
        </label>
        <Switch id={`testimonial-auth-${index}`} checked={form.authorized} onCheckedChange={(authorized) => setForm({ ...form, authorized })} />
      </div>
      {error && (
        <p role="alert" className="text-14 text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" variant="secondary" loading={pending}>
          {copy.save}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={remove}>
          {copy.remove}
        </Button>
      </div>
    </form>
  );
}

let draftKey = 0;

export function TestimonialsEditor({ initial, projects }: { initial: TestimonialRow[]; projects: { id: string; company_name: string }[] }) {
  const [rows, setRows] = useState(() => initial.map((row) => ({ key: row.id ?? `n${draftKey++}`, row })));

  return (
    <section aria-labelledby="pf-testimonials" className="panel flex flex-col gap-4 p-5" data-testid="pf-testimonials">
      <PanelHeader id="pf-testimonials" icon={MessageSquareQuote} title={copy.title} as="h3" />
      <p className="text-13 text-muted">{copy.help}</p>
      {rows.map(({ key, row }, index) => (
        <TestimonialForm
          key={key}
          row={row}
          index={index}
          projects={projects}
          onSaved={(saved) => setRows((current) => current.map((item) => (item.key === key ? { key, row: saved } : item)))}
          onRemoved={() => setRows((current) => current.filter((item) => item.key !== key))}
        />
      ))}
      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() =>
          setRows((current) => [
            ...current,
            { key: `n${draftKey++}`, row: { id: null, first_name: "", company: "", quote: "", authorized: false, project_id: null } },
          ])
        }
      >
        <Plus aria-hidden="true" size={16} strokeWidth={1.75} />
        {copy.add}
      </Button>
    </section>
  );
}
