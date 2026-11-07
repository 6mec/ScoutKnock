import type { Metadata } from "next";
import { Suspense } from "react";
import { PageIntro } from "@/components/app/page-intro";
import { ContactsScreen } from "@/components/contacts/contacts-screen";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { requireUser } from "@/lib/auth/current-user";
import { DEFAULT_DAILY_GOAL, PACE_DAYS, type ContactEvent } from "@/lib/contacts/crm";
import type { Contact } from "@/lib/contacts/rules";
import { parseStatusFilter } from "@/lib/dashboard/rules";
import { portfolioUrl } from "@/lib/portfolio/rules";
import { homePortfolioSlug, siteUrl } from "@/lib/site";
import { reportError } from "@/lib/events/log";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: ptPT.app.nav.contacts,
  robots: { index: false },
};

const DAY_MS = 86_400_000;

export default function ContactsPage({
  searchParams,
}: PageProps<"/painel/contactos">) {
  return (
    <>
      <PageIntro title={ptPT.contacts.pageTitle} description={ptPT.contacts.pageSubtitle} />
      <Suspense fallback={<Skeleton className="m-4 h-96 rounded-lg lg:m-8" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

// Só lê a base de dados: os contactos, o ritmo dos últimos dias e a meta diária.
async function Content({
  searchParams,
}: Pick<PageProps<"/painel/contactos">, "searchParams">) {
  const user = await requireUser();
  const { estado, contacto } = await searchParams;
  const supabase = await createClient();
  // Um dia a mais, para o primeiro dia do ritmo ficar completo em Lisboa.
  const since = new Date(new Date().getTime() - (PACE_DAYS + 1) * DAY_MS).toISOString();
  const [contacts, events, profile, template, portfolio] = await Promise.all([
    supabase.from("contacts").select("*").order("created_at", { ascending: false }),
    supabase
      .from("contact_events")
      .select("contact_id, kind, status, created_at")
      .eq("kind", "status")
      .gte("created_at", since)
      .limit(5000),
    supabase.from("profiles").select("daily_goal").eq("id", user.id).maybeSingle(),
    // À parte: se esta coluna faltar, a meta continua a ler-se.
    supabase.from("profiles").select("whatsapp_template").eq("id", user.id).maybeSingle(),
    supabase.from("portfolios").select("slug, published").eq("user_id", user.id).maybeSingle(),
  ]);
  // O {portfolio} da mensagem só tem link com o portfólio publicado.
  const published = portfolio.data?.published ? (portfolio.data.slug as string) : null;

  if (contacts.error) {
    await reportError("contactos lista", contacts.error.code, user.id);
    return (
      <p role="alert" className="px-4 py-8 lg:px-8">
        {ptPT.contacts.errors.generic}
      </p>
    );
  }
  // Sem histórico, a lista continua a funcionar: só o ritmo fica vazio.
  if (events.error) await reportError("contactos ritmo", events.error.code, user.id);

  return (
    <ContactsScreen
      initial={contacts.data as Contact[]}
      events={(events.data ?? []) as ContactEvent[]}
      dailyGoal={(profile.data?.daily_goal as number | undefined) ?? DEFAULT_DAILY_GOAL}
      whatsappTemplate={(template.data?.whatsapp_template as string | null | undefined) ?? null}
      portfolioUrl={
        published ? portfolioUrl(published, siteUrl(), homePortfolioSlug()) : null
      }
      statusFilter={parseStatusFilter(estado)}
      openContactId={typeof contacto === "string" && /^[0-9a-f-]{36}$/i.test(contacto) ? contacto : null}
    />
  );
}
