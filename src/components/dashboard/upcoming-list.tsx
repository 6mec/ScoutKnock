import { FolderKanban, UserRound } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ptPT } from "@/i18n/pt-PT";
import type { UpcomingTask } from "@/lib/dashboard/metrics";

const copy = ptPT.dashboard.tasks;
const dayFormat = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short", timeZone: "UTC" });
const day = (date: string) => dayFormat.format(new Date(`${date}T00:00:00Z`));

// Próximas ações dos contactos e entregas dos projetos, cada uma a abrir o sítio onde se faz.
export function UpcomingList({ tasks, today }: { tasks: UpcomingTask[]; today: string }) {
  if (tasks.length === 0) return <p className="text-14 text-muted">{copy.empty}</p>;

  return (
    <ul className="flex flex-col divide-y divide-border-subtle" data-testid="upcoming-tasks">
      {tasks.map((task) => {
        const Icon = task.kind === "contact" ? UserRound : FolderKanban;
        const href = task.kind === "contact" ? `/painel/contactos?contacto=${task.id}` : "/painel/projetos";
        return (
          <li key={`${task.kind}-${task.id}`} data-testid="upcoming-task">
            <Link
              href={href}
              className="focus-ring flex min-h-11 items-start gap-3 rounded-sm py-2.5 transition-colors duration-(--duration-fast) hovered:text-accent"
            >
              <Icon aria-hidden="true" size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-muted" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-14 font-medium">{task.title}</span>
                <span className="truncate text-13 text-muted">
                  {task.kind === "contact" ? copy.contact : copy.project}
                  {task.detail ? ` · ${task.detail}` : ""}
                </span>
              </span>
              {task.overdue ? (
                <Badge variant="danger" className="shrink-0">
                  {copy.overdue} · {day(task.date)}
                </Badge>
              ) : (
                <span className="type-number shrink-0 text-13 text-muted">{task.date === today ? copy.today : day(task.date)}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
