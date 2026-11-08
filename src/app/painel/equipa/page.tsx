import type { Metadata } from "next";
import { UserRoundCog } from "lucide-react";
import { Suspense } from "react";
import { PageIntro } from "@/components/app/page-intro";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { requireUser } from "@/lib/auth/current-user";
import { TeamMembers } from "@/components/team/team-members";
import { createClient } from "@/lib/supabase/server";
import type { TeamMember } from "@/lib/team/rules";

const copy = ptPT.team;

export const metadata: Metadata = {
  title: ptPT.pages.team.title,
  robots: { index: false },
};

export default function TeamPage() {
  return (
    <>
      <PageIntro title={ptPT.pages.team.title} description={ptPT.pages.team.description} />
      <Suspense fallback={<Skeleton className="m-4 h-40 rounded-lg lg:m-8" />}>
        <Content />
      </Suspense>
    </>
  );
}

// Só a verdade: hoje a equipa é quem tem a sessão aberta.
async function Content() {
  const user = await requireUser();
  const supabase = await createClient();
  const invites = await supabase.from("team_members").select("id, email, role, status, created_at").order("created_at").limit(100);
  return (
    <div className="mx-auto flex w-full max-w-300 flex-col gap-4 px-4 pt-6 pb-8 lg:px-8">
      <section aria-labelledby="equipa-membros" className="panel flex flex-col gap-4 p-5">
        <h2 id="equipa-membros" className="text-16 font-semibold">
          {copy.members}
        </h2>
        <ul className="flex flex-col divide-y divide-border">
          <li className="flex flex-wrap items-center justify-between gap-3 py-3">
            <span className="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className="inline-flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                <UserRoundCog size={17} strokeWidth={1.75} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-14 font-medium">{user.email}</span>
                <span className="text-13 text-muted">{copy.you}</span>
              </span>
            </span>
            <Badge variant="accent">{copy.roles.admin}</Badge>
          </li>
        </ul>
        <p className="text-13 text-muted">{copy.soloNote}</p>
      </section>
      <section aria-labelledby="equipa-convites" className="panel flex flex-col gap-4 p-5">
        <h2 id="equipa-convites" className="text-16 font-semibold">
          {copy.invitesTitle}
        </h2>
        <TeamMembers members={(invites.data ?? []) as TeamMember[]} available={!invites.error} />
      </section>
    </div>
  );
}
