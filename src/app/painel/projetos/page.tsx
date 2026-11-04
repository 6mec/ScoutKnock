import type { Metadata } from "next";
import { Suspense } from "react";
import { PageIntro } from "@/components/app/page-intro";
import { ProjectsScreen } from "@/components/projects/projects-screen";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { requireUser } from "@/lib/auth/current-user";
import { todayIn } from "@/lib/demos/booking";
import { reportError } from "@/lib/events/log";
import {
  PROJECT_COLUMNS,
  sortProjects,
  type ClientProject,
  type ProjectEvent,
} from "@/lib/projects/rules";
import { createClient } from "@/lib/supabase/server";

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
  const user = await requireUser();
  const { novo } = await searchParams;
  const supabase = await createClient();
  const [projects, events, contacts] = await Promise.all([
    supabase.from("client_projects").select(PROJECT_COLUMNS).order("created_at", { ascending: false }).limit(500),
    supabase
      .from("client_project_events")
      .select("project_id, kind, status, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase.from("contacts").select("id, label").order("label").limit(1000),
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

  const today = todayIn();
  return (
    <ProjectsScreen
      projects={sortProjects((projects.data ?? []) as ClientProject[], today)}
      events={(events.data ?? []) as ProjectEvent[]}
      contacts={(contacts.data ?? []) as { id: string; label: string }[]}
      today={today}
      openNew={novo === "1"}
    />
  );
}
