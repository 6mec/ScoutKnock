"use client";

import { Check, CircleAlert, Flag, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import {
  addChecklistItem,
  deleteChecklistItem,
  setChecklistItemDone,
  setProjectFinished,
  setProjectNextStep,
  setProjectPhase,
  type ChecklistItem,
} from "@/lib/cycle/actions";
import { PROJECT_PHASES, isProjectPhase, type ProjectPhase } from "@/lib/projects/cycle";
import type { ClientProject } from "@/lib/projects/rules";
import { cn } from "@/lib/utils";

const copy = ptPT.projects.cycle;

// A ficha do projeto, em cima no diálogo: fase, próximo passo, checklist e origem.
// Cada ação grava logo (não espera pelo "Guardar projeto").
export function ProjectCycle({
  project,
  checklist,
  onDates,
}: {
  project: ClientProject;
  checklist: ChecklistItem[];
  // Datas preenchidas ao mudar de fase, para o formulário de baixo não as apagar.
  onDates: (dates: Record<string, string>) => void;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<ProjectPhase | null>(isProjectPhase(project.phase) ? project.phase : null);
  const [finished, setFinished] = useState(project.status === "finished");
  const [nextStep, setNextStep] = useState(project.next_step ?? "");
  const [items, setItems] = useState(() => checklist.filter((item) => item.project_id === project.id).sort((a, b) => a.position - b.position));
  const [newItem, setNewItem] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const done = items.filter((item) => item.done).length;

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch {
        setError(ptPT.projects.errors.generic);
      }
    });
  }

  function choosePhase(next: ProjectPhase) {
    run(async () => {
      const result = await setProjectPhase(project.id, next);
      if (!result.ok) throw new Error();
      setPhase(next);
      onDates(result.dates);
      toast.success(copy.phaseSaved(copy.phases[next]));
      router.refresh();
    });
  }

  function saveNextStep(event: FormEvent) {
    event.preventDefault();
    run(async () => {
      const { ok } = await setProjectNextStep(project.id, nextStep);
      if (!ok) throw new Error();
      toast.success(copy.nextStepSaved);
      router.refresh();
    });
  }

  // Marca logo no ecrã e grava; se o servidor recusar, volta atrás.
  function toggle(item: ChecklistItem) {
    const flip = (done: boolean) =>
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, done } : entry)));
    flip(!item.done);
    run(async () => {
      const result = await setChecklistItemDone(item.id, !item.done);
      if (!result.ok) {
        flip(item.done);
        throw new Error();
      }
      if (result.draft) toast.success(copy.checklistDraft);
      router.refresh();
    });
  }

  function add(event: FormEvent) {
    event.preventDefault();
    if (!newItem.trim()) return;
    run(async () => {
      const result = await addChecklistItem(project.id, newItem);
      if (!result.ok) throw new Error();
      setItems((current) => [...current, result.item]);
      setNewItem("");
    });
  }

  function remove(item: ChecklistItem) {
    run(async () => {
      const { ok } = await deleteChecklistItem(item.id);
      if (!ok) throw new Error();
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    });
  }

  function finish(value: boolean) {
    run(async () => {
      const result = await setProjectFinished(project.id, value);
      if (!result.ok) throw new Error();
      setFinished(value);
      toast.success(value ? copy.finished : copy.reopened);
      router.refresh();
    });
  }

  const origin = project.origin_source
    ? copy.originLine(copy.originSources[project.origin_source], project.origin_niche ?? null, project.origin_locality ?? null)
    : copy.noOrigin;

  return (
    <section aria-labelledby={`ciclo-${project.id}`} className="flex flex-col gap-4 rounded-lg border border-border bg-surface-raised/40 p-4" data-testid="project-cycle">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`ciclo-${project.id}`} className="text-15 font-semibold">
          {copy.title}
        </h3>
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => finish(!finished)}>
          <Flag aria-hidden="true" size={14} />
          {finished ? copy.reopen : copy.finish}
        </Button>
      </div>

      {/* Fases: clica-se na fase em que o projeto está. */}
      <ol aria-label={copy.phaseLabel} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" data-testid="project-phases">
        {PROJECT_PHASES.map((item, index) => {
          const current = item === phase;
          const past = phase !== null && PROJECT_PHASES.indexOf(phase) > index;
          return (
            <li key={item} className="shrink-0">
              <button
                type="button"
                disabled={pending}
                aria-current={current ? "step" : undefined}
                onClick={() => choosePhase(item)}
                className={cn(
                  "focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-pill border px-3 text-13 whitespace-nowrap transition-colors",
                  current
                    ? "border-accent bg-accent text-accent-contrast"
                    : past
                      ? "border-accent/30 bg-accent-soft text-foreground"
                      : "border-border bg-surface text-muted hovered:text-foreground",
                )}
              >
                {past && <Check aria-hidden="true" size={13} />}
                {copy.phases[item]}
              </button>
            </li>
          );
        })}
      </ol>
      {phase === null && <p className="-mt-2 text-13 text-muted">{copy.noPhase}</p>}

      {/* Próximo passo, em destaque. */}
      <form onSubmit={saveNextStep} className="flex flex-col gap-2 rounded-md border-l-2 border-gold bg-surface p-3" data-testid="project-next-step">
        <label htmlFor={`proximo-${project.id}`} className="text-13 font-semibold">
          {copy.nextStep}
        </label>
        <div className="flex gap-2">
          <Input
            id={`proximo-${project.id}`}
            value={nextStep}
            maxLength={200}
            placeholder={copy.nextStepPlaceholder}
            onChange={(event) => setNextStep(event.target.value)}
          />
          <Button type="submit" variant="secondary" disabled={pending}>
            {copy.nextStepSave}
          </Button>
        </div>
      </form>

      {/* Checklist de entrega. */}
      <div className="flex flex-col gap-2" data-testid="project-checklist">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-13 font-semibold">{copy.checklist}</h4>
          {items.length > 0 && <span className="text-13 text-muted tabular-nums">{copy.checklistProgress(done, items.length)}</span>}
        </div>
        {items.length === 0 ? (
          <p className="text-13 text-muted">{copy.checklistEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.id} className="group flex items-center gap-2 rounded-md px-1 py-0.5 hovered:bg-surface">
                <input
                  id={`item-${item.id}`}
                  type="checkbox"
                  checked={item.done}
                  disabled={pending}
                  onChange={() => toggle(item)}
                  className="size-4 shrink-0 accent-[var(--accent)]"
                />
                <label htmlFor={`item-${item.id}`} className={cn("flex-1 text-14", item.done && "text-muted line-through")}>
                  {item.label}
                </label>
                <Button type="button" variant="ghost" size="sm" disabled={pending} aria-label={copy.checklistRemove(item.label)} onClick={() => remove(item)}>
                  <Trash2 aria-hidden="true" size={14} />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={add} className="flex gap-2">
          <Input aria-label={copy.checklistAddLabel} value={newItem} maxLength={160} placeholder={copy.checklistAddLabel} onChange={(event) => setNewItem(event.target.value)} />
          <Button type="submit" variant="secondary" disabled={pending || !newItem.trim()}>
            <Plus aria-hidden="true" size={15} />
            {copy.checklistAdd}
          </Button>
        </form>
      </div>

      <p className="text-13 text-muted" data-testid="project-origin">
        <span className="font-medium text-foreground">{copy.origin}:</span> {origin}
      </p>

      <div aria-live="polite">
        {error && (
          <p className="flex items-start gap-2 text-14 text-danger">
            <CircleAlert aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
