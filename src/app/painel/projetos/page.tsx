import type { Metadata } from "next";
import { Suspense } from "react";
import { PageIntro } from "@/components/app/page-intro";
import { ProjectsScreen } from "@/components/projects/projects-screen";
import { ProjectsTabs } from "@/components/projects/projects-tabs";
import { RequestList } from "@/components/requests/request-list";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { getAccess } from "@/lib/team/access";
import { todayIn } from "@/lib/demos/booking";
import { reportError } from "@/lib/events/log";
import {
  PROJECT_COLUMNS,
  sortProjects,
  type ClientProject,
  type ProjectEvent,
} from "@/lib/projects/rules";
import { PAYMENT_COLUMNS, type ProjectPayment } from "@/lib/projects/payments";
import { sortRequests, type WorkRequest } from "@/lib/requests/rules";
import { createClient } from "@/lib/supabase/server";
import type { ChecklistItem } from "@/lib/cycle/actions";

export const metadata: Metadata = {
  title: ptPT.projects.title,
  robots: { index: false },
};

export default function ProjectsPage({ searchParams }: PageProps<"/painel/projetos">) {
  return (
    <>
      <PageIntro title={ptPT.pages.projects.title} description={ptPT.pages.projects.description} />
      <Suspense fallback={<Skeleton className="m-4 h-96 rounded-lg lg:m-8" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Content({ searchParams }: Pick<PageProps<"/painel/projetos">, "searchParams">) {
  // O Comercial não vê projetos nem pagamentos: abre só os Pedidos.
  if ((await getAccess()).role !== "owner") redirect("/painel/pedidos");
  const user = await requireUser();
  const { novo, projeto } = await searchParams;
  const supabase = await createClient();
  const [projects, events, contacts, payments, requests, checklist] = await Promise.all([
    supabase.from("client_projects").select(PROJECT_COLUMNS).order("created_at", { ascending: false }).limit(500),
    supabase
      .from("client_project_events")
      .select("project_id, kind, status, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase.from("contacts").select("id, label").order("label").limit(1000),
    supabase.from("client_project_payments").select(PAYMENT_COLUMNS).order("paid_on", { ascending: false }).limit(2000),
    supabase
      .from("work_requests")
      .select("id, contact_id, demo_id, company_name, kind, brief, status, result_note, result_url, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("project_checklist_items").select("id, project_id, label, done, position, kind").order("position").limit(4000),
  ]);

  if (projects.error) {
    await reportError("projetos lista", projects.error.code, user.id);
    return (
      <p role="alert" className="px-4 py-8 lg:px-8">
        {ptPT.projects.errors.generic}
      </p>
    );
  }
  if (events.error) await reportError("projetos histórico", events.error.code, user.id);
  if (contacts.error) await reportError("projetos contactos", contacts.error.code, user.id);
  if (payments.error) await reportError("projetos pagamentos", payments.error.code, user.id);
  if (requests.error) await reportError("pedidos ler", requests.error.code, user.id);
  if (checklist.error) await reportError("projetos checklist", checklist.error.code, user.id);
  const requestRows = sortRequests((requests.data ?? []) as WorkRequest[]);

  const today = todayIn();
  return (
    <ProjectsTabs
      openRequests={requestRows.filter((row) => row.status === "pending" || row.status === "in_progress").length}
      projects={
        <ProjectsScreen
          projects={sortProjects((projects.data ?? []) as ClientProject[], today)}
          events={(events.data ?? []) as ProjectEvent[]}
          payments={(payments.data ?? []) as ProjectPayment[]}
          contacts={(contacts.data ?? []) as { id: string; label: string }[]}
          today={today}
          openNew={novo === "1"}
          openProject={typeof projeto === "string" ? projeto : null}
          checklist={(checklist.data ?? []) as ChecklistItem[]}
        />
      }
      requests={<RequestList requests={requestRows} />}
    />
  );
}
