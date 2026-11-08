import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PageIntro } from "@/components/app/page-intro";
import { SessionScreen } from "@/components/contacts/session-screen";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { requireUser } from "@/lib/auth/current-user";
import { DEFAULT_DAILY_GOAL, type ContactEvent } from "@/lib/contacts/crm";
import type { Contact } from "@/lib/contacts/rules";
import { loadDemoLinks } from "@/lib/demos/load-links";
import { reportError } from "@/lib/events/log";
import { createClient } from "@/lib/supabase/server";
import { loadOutreach } from "@/lib/team/outreach";

const copy = ptPT.contacts.session;

export const metadata: Metadata = {
  title: copy.title,
  robots: { index: false },
};

export default function SessionPage() {
  return (
    <>
      <PageIntro
        title={copy.title}
        description={copy.description}
        before={
          <Button asChild variant="ghost" size="sm" className="mb-2 self-start">
            <Link href="/painel/contactos">
              <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.75} />
              {copy.back}
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<Skeleton className="m-4 h-96 rounded-lg lg:m-8" />}>
        <Content />
      </Suspense>
    </>
  );
}

// Só lê: a fila, o que já se fez hoje (para a meta), a meta, o modelo da mensagem e os links.
async function Content() {
  const user = await requireUser();
  const supabase = await createClient();
  // O dia de hoje em Lisboa começa no máximo 26 h antes de agora.
  const since = new Date(new Date().getTime() - 26 * 3_600_000).toISOString();
  const [contacts, events, profile, outreach, demoLinks] = await Promise.all([
    supabase.from("contacts").select("*").order("created_at", { ascending: true }),
    supabase.from("contact_events").select("contact_id, kind, status, created_at").eq("kind", "status").gte("created_at", since).limit(2000),
    supabase.from("profiles").select("daily_goal").eq("id", user.id).maybeSingle(),
    loadOutreach(supabase),
    loadDemoLinks(supabase, user.id),
  ]);
  if (contacts.error) {
    await reportError("sessão contactos", contacts.error.code, user.id);
    return (
      <p role="alert" className="px-4 py-8 lg:px-8">
        {ptPT.contacts.errors.generic}
      </p>
    );
  }

  return (
    <SessionScreen
      initial={contacts.data as Contact[]}
      events={(events.data ?? []) as ContactEvent[]}
      dailyGoal={(profile.data?.daily_goal as number | undefined) ?? DEFAULT_DAILY_GOAL}
      whatsappTemplate={outreach.template}
      portfolioUrl={outreach.portfolioUrl}
      demoLinks={demoLinks}
    />
  );
}
