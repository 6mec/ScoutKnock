"use client";

import {
  AlertTriangle,
  AppWindow,
  CalendarClock,
  ExternalLink,
  FolderOpen,
  Globe,
  Plus,
  Search,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { projectBalance, type ProjectPayment } from "@/lib/projects/payments";
import { RequestWorkButton } from "@/components/requests/request-work-button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { ptPT } from "@/i18n/pt-PT";
import {
  PROJECT_STATUSES,
  amount,
  filterProjects,
  isLate,
  nextDate,
  projectTotals,
  safeProjectUrl,
  type ClientProject,
  type ProjectEvent,
  type ProjectKind,
  type ProjectStatus,
} from "@/lib/projects/rules";
import { cn } from "@/lib/utils";

const { projects: copy } = ptPT;
const ICONS: Record<ProjectKind, LucideIcon> = {
  site: Globe,
  site_booking: CalendarClock,
  app: AppWindow,
  other: Wrench,
};
const BADGES: Record<ProjectStatus, BadgeVariant> = {
  requested: "amber",
  in_progress: "accent",
  delivered: "neutral",
  maintenance: "accent",
  finished: "outline",
};
const money = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });
const dayFormat = new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeZone: "UTC" });

function day(date: string) {
  return dayFormat.format(new Date(`${date}T00:00:00Z`));
}

export function ProjectsScreen({
  projects,
  events,
  payments,
  contacts,
  today,
  openNew = false,
}: {
  projects: ClientProject[];
  events: ProjectEvent[];
  payments: ProjectPayment[];
  contacts: { id: string; label: string }[];
  today: string;
  // Vindo do Início ("Novo projeto"): abre logo o diálogo.
  openNew?: boolean;
}) {
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [search, setSearch] = useState("");
  const visible = filterProjects(projects, status, search);
  const totals = projectTotals(projects);
  const counts = Object.fromEntries(
    PROJECT_STATUSES.map((item) => [item, projects.filter((project) => project.status === item).length]),
  ) as Record<ProjectStatus, number>;

  return (
    <div className="mx-auto flex w-full max-w-300 flex-col gap-5 px-4 pt-6 pb-8 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-80">
          <Search aria-hidden="true" size={16} className="pointer-events-none absolute top-3.5 left-3 z-10 text-muted" />
          <Input
            type="search"
            aria-label={copy.search}
            placeholder={copy.search}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <ProjectDialog
          contacts={contacts}
          defaultOpen={openNew}
          trigger={
            <Button data-testid="project-create">
              <Plus aria-hidden="true" size={16} />
              {copy.newProject}
            </Button>
          }
        />
      </div>

      <div role="group" aria-label={copy.filterLabel} className="flex flex-wrap gap-2">
        {(["all", ...PROJECT_STATUSES] as const).map((item) => {
          const active = status === item;
          const count = item === "all" ? projects.length : counts[item];
          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              onClick={() => setStatus(item)}
              className={cn(
                "focus-ring inline-flex min-h-11 items-center gap-2 rounded-pill border border-border px-3.5 text-14 text-muted transition-colors hovered:text-foreground",
                active && "border-accent/50 bg-accent-soft text-accent hovered:text-accent",
              )}
            >
              {item === "all" ? copy.all : copy.statuses[item]}
              <span className="tabular-nums text-13">{count}</span>
            </button>
          );
        })}
      </div>

      {projects.length > 0 && (
        <p className="text-13 text-muted" data-testid="project-totals">
          {copy.totals.line(
            money.format(totals.build),
            totals.buildCount,
            money.format(totals.maintenance),
            totals.maintenanceCount,
          )}
        </p>
      )}

      {visible.length === 0 ? (
        <EmptyState title={projects.length === 0 ? copy.empty : copy.emptyFiltered} className="bg-surface" />
      ) : (
        <ul data-testid="project-list" className="grid gap-3 lg:grid-cols-2">
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} events={events} payments={payments} today={today} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Value({ label, value, suffix }: { label: string; value: number | string | null; suffix?: string }) {
  const number = amount(value);
  return (
    <div className="flex flex-col">
      <dt className="text-12 text-muted">{label}</dt>
      <dd className="text-14 font-medium tabular-nums">
        {number === null ? copy.card.none : `${money.format(number)}${suffix ?? ""}`}
      </dd>
    </div>
  );
}

function ProjectCard({
  project,
  events,
  payments,
  today,
}: {
  project: ClientProject;
  events: ProjectEvent[];
  payments: ProjectPayment[];
  today: string;
}) {
  const balance = projectBalance(project, payments);
  const Icon = ICONS[project.kind];
  const late = isLate(project, today);
  const next = nextDate(project);
  const url = safeProjectUrl(project.link);
  const editRef = useRef<HTMLButtonElement>(null);

  // O cartão inteiro abre o projeto com o rato. Botões, links e o diálogo (que vem por
  // portal) tratam dos seus cliques; texto selecionado não abre. No teclado: o "Editar".
  function openFromCard(event: MouseEvent<HTMLLIElement>) {
    const target = event.target as HTMLElement;
    if (!event.currentTarget.contains(target)) return;
    if (target.closest("a, button, input, textarea, select, label, [role=dialog]")) return;
    if (window.getSelection()?.toString()) return;
    editRef.current?.click();
  }

  return (
    <li
      data-testid="project-item"
      onClick={openFromCard}
      className={cn(
        "panel flex cursor-pointer flex-col gap-4 p-5 transition-colors hovered:border-accent/40",
        late && "border-danger/40",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-md border border-accent/25 bg-accent-soft text-accent"
          >
            <Icon size={17} />
          </span>
          <div className="min-w-0">
            <h3 className="text-16 font-semibold break-words">{project.company_name}</h3>
            <p className="text-13 text-muted">
              {project.name === copy.kinds[project.kind] ? project.name : `${project.name} · ${copy.kinds[project.kind]}`}
            </p>
          </div>
        </div>
        <Badge variant={BADGES[project.status]} data-testid="project-status">
          {copy.statuses[project.status]}
        </Badge>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        <Value label={copy.card.build} value={project.build_value} />
        <Value label={copy.card.thirdParty} value={project.third_party_value} />
        <Value label={copy.card.maintenance} value={project.maintenance_monthly} suffix={copy.card.perMonth} />
      </dl>
      {project.third_party_note && <p className="-mt-2 text-13 text-muted">{project.third_party_note}</p>}
      {balance.paid > 0 && (
        <p className="-mt-2 text-13 font-medium" data-testid="project-paid">
          {copy.payments.cardPaid(money.format(balance.paid), money.format(balance.remaining))}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-14">
        {late ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-danger" data-testid="project-late">
            <AlertTriangle aria-hidden="true" size={15} />
            {copy.card.late} · {copy.card.due(day(project.due_date as string))}
          </span>
        ) : (
          <span className="text-muted">
            {next
              ? next.kind === "due"
                ? copy.card.due(day(next.date))
                : next.kind === "delivered"
                  ? copy.card.delivered(day(next.date))
                  : copy.card.maintenanceSince(day(next.date))
              : copy.card.noDate}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <ProjectDialog
          project={project}
          events={events}
          payments={payments}
          today={today}
          trigger={
            <Button ref={editRef} size="sm" data-testid="project-edit">
              {copy.edit}
              <span className="sr-only"> {project.company_name}</span>
            </Button>
          }
        />
        {project.contact_id && (
          <Button asChild size="sm" variant="secondary">
            <Link href={`/painel/contactos?contacto=${project.contact_id}`}>{copy.openContact}</Link>
          </Button>
        )}
        {project.work_request_id && (
          <Button asChild size="sm" variant="secondary">
            <Link href={`/painel/projetos?separador=pedidos#pedido-${project.work_request_id}`}>{copy.openRequest}</Link>
          </Button>
        )}
        {url ? (
          <Button asChild size="sm" variant="secondary">
            <a href={url} target="_blank" rel="noreferrer noopener">
              <ExternalLink aria-hidden="true" size={14} />
              {copy.openLink}
              <span className="sr-only"> {ptPT.demos.view.newTab}</span>
            </a>
          </Button>
        ) : (
          project.link && (
            <span className="inline-flex items-center gap-1.5 text-13 text-muted">
              <FolderOpen aria-hidden="true" size={14} />
              <code className="type-mono break-all">{project.link}</code>
            </span>
          )
        )}
        {project.contact_id && (
          <RequestWorkButton
            companyName={project.company_name}
            contactId={project.contact_id}
            defaultKind={project.kind === "other" ? "site" : project.kind}
            size="sm"
          />
        )}
      </div>
    </li>
  );
}
