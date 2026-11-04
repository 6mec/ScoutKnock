"use client";

import { AppWindow, CalendarClock, ExternalLink, FolderKanban, Globe, Terminal, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { kindFromRequest } from "@/lib/projects/rules";
import { cancelWorkRequest, deleteWorkRequest } from "@/lib/requests/actions";
import { safeResultUrl, type RequestKind, type RequestStatus, type WorkRequest } from "@/lib/requests/rules";

const { requests: copy } = ptPT;
const ICONS: Record<RequestKind, LucideIcon> = { site: Globe, site_booking: CalendarClock, app: AppWindow };
const BADGES: Record<RequestStatus, "amber" | "accent" | "neutral" | "outline"> = {
  pending: "amber",
  in_progress: "accent",
  done: "neutral",
  cancelled: "outline",
};
const dateFormat = new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeZone: "Europe/Lisbon" });

export function RequestList({ requests }: { requests: WorkRequest[] }) {
  return (
    <div className="mx-auto flex w-full max-w-300 flex-col gap-4 px-4 pt-6 pb-8 lg:px-8">
      <Callout title={copy.howTo}>
        <p className="flex items-center gap-2">
          <Terminal aria-hidden="true" size={15} />
          <code className="type-mono rounded-sm bg-surface px-1.5 py-0.5">/pedidos</code>
        </p>
      </Callout>
      {requests.length === 0 ? (
        <EmptyState title={copy.empty} className="bg-surface" />
      ) : (
        <ul data-testid="request-list" className="flex flex-col gap-3">
          {requests.map((request) => (
            <RequestItem key={request.id} request={request} />
          ))}
        </ul>
      )}
    </div>
  );
}

function RequestItem({ request }: { request: WorkRequest }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const Icon = ICONS[request.kind];
  const url = safeResultUrl(request.result_url);

  function run(action: () => Promise<{ ok: boolean }>, success: string) {
    startTransition(async () => {
      const { ok } = await action();
      if (ok) toast.success(success);
      else toast.error(copy.errors.generic);
      router.refresh();
    });
  }

  return (
    <li id={`pedido-${request.id}`} data-testid="request-item" className="panel flex scroll-mt-20 flex-col gap-3 p-5 target:border-accent/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-md border border-accent/25 bg-accent-soft text-accent">
            <Icon size={17} />
          </span>
          <div className="min-w-0">
            <h2 className="text-16 font-semibold">{request.company_name}</h2>
            <p className="text-13 text-muted">
              {copy.kinds[request.kind]} · {copy.created(dateFormat.format(new Date(request.created_at)))}
            </p>
          </div>
        </div>
        <Badge variant={BADGES[request.status]} data-testid="request-status">
          {copy.statuses[request.status]}
        </Badge>
      </div>
      <p className="text-14 whitespace-pre-line">{request.brief}</p>
      {request.result_note && (
        <div className="panel-row flex flex-col gap-1 p-3">
          <p className="text-13 font-semibold">{copy.result}</p>
          <p className="text-14 whitespace-pre-line text-muted">{request.result_note}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {url && (
          <Button asChild size="sm">
            <a href={url} target="_blank" rel="noreferrer noopener">
              <ExternalLink aria-hidden="true" size={14} />
              {copy.openResult}
              <span className="sr-only"> {ptPT.demos.view.newTab}</span>
            </a>
          </Button>
        )}
        {request.demo_id && (
          <Button asChild size="sm" variant="secondary">
            <Link href={`/painel/demos/${request.demo_id}`}>{copy.openDemo}</Link>
          </Button>
        )}
        {request.status !== "cancelled" && (
          <ProjectDialog
            draft={{
              companyName: request.company_name,
              contactId: request.contact_id,
              workRequestId: request.id,
              name: copy.kinds[request.kind],
              kind: kindFromRequest(request.kind),
              notes: request.brief.slice(0, 4000),
            }}
            trigger={
              <Button size="sm" variant="secondary" data-testid="request-to-project">
                <FolderKanban aria-hidden="true" size={14} />
                {copy.toProject}
              </Button>
            }
          />
        )}
        {request.status === "pending" && (
          <Button size="sm" variant="ghost" loading={pending} onClick={() => run(() => cancelWorkRequest(request.id), copy.cancelled)}>
            {copy.cancel}
          </Button>
        )}
        {request.status !== "in_progress" && request.status !== "pending" && (
          <Button size="sm" variant="ghost" loading={pending} onClick={() => run(() => deleteWorkRequest(request.id), copy.removed)}>
            {copy.remove}
          </Button>
        )}
      </div>
    </li>
  );
}
