import type { Metadata } from "next";
import { Suspense } from "react";
import { PageIntro } from "@/components/app/page-intro";
import { PortfolioEditor, type PortfolioFormValues } from "@/components/portfolio/portfolio-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { requireUser } from "@/lib/auth/current-user";
import { reportError } from "@/lib/events/log";
import { suggestSlug, type PortfolioService, type PortfolioStep } from "@/lib/portfolio/rules";
import type { TestimonialRow } from "@/components/portfolio/testimonials-editor";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: ptPT.portfolio.title,
  robots: { index: false },
};

export default function PortfolioPage() {
  return (
    <>
      <PageIntro title={ptPT.portfolio.title} description={ptPT.portfolio.subtitle} />
      <Suspense fallback={<Skeleton className="m-4 h-96 rounded-lg lg:m-8" />}>
        <Content />
      </Suspense>
    </>
  );
}

// Só lê a base de dados: o portfólio, o nome do perfil, os projetos e as opiniões.
async function Content() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: row, error }, { data: profile }, projectRows, testimonialRows] = await Promise.all([
    supabase.from("portfolios").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("client_projects").select("id, company_name, portfolio_show").order("company_name").limit(500),
    supabase
      .from("portfolio_testimonials")
      .select("id, first_name, company, quote, authorized, project_id")
      .order("created_at")
      .limit(50),
  ]);
  if (error) await reportError("portfolio ler", error.code, user.id);
  if (projectRows.error) await reportError("portfolio projetos", projectRows.error.code, user.id);
  if (testimonialRows.error) await reportError("portfolio opiniões", testimonialRows.error.code, user.id);

  const name = (row?.display_name as string | undefined) ?? (profile?.display_name as string | null) ?? "";
  const steps = (row?.process_steps as PortfolioStep[] | undefined) ?? [];
  const initial: PortfolioFormValues = {
    slug: (row?.slug as string | undefined) ?? suggestSlug(name),
    published: (row?.published as boolean | undefined) ?? false,
    indexable: (row?.indexable as boolean | undefined) ?? false,
    displayName: name,
    headline: (row?.headline as string | null) ?? "",
    about: (row?.about as string | null) ?? "",
    city: (row?.city as string | null) ?? "",
    whatsapp: (row?.whatsapp as string | null) ?? "",
    // O email da conta não entra sozinho numa página pública.
    email: (row?.email as string | null) ?? "",
    services: ((row?.services as PortfolioService[] | undefined) ?? []).map((s) => ({
      title: s.title,
      description: s.description ?? "",
    })),
    // Sem passos guardados, começa com os textos de base (editáveis).
    processSteps: (steps.length > 0 ? steps : ptPT.portfolio.defaultSteps).map((step) => ({ title: step.title, text: step.text })),
    priceFrom: (row?.price_from as string | null) ?? "",
  };
  // Sem nada escrito, começa com uma linha vazia.
  if (initial.services.length === 0) initial.services.push({ title: "", description: "" });

  const projects = (projectRows.data ?? []) as { id: string; company_name: string; portfolio_show: boolean }[];
  return (
    <PortfolioEditor
      initial={initial}
      savedSlug={(row?.slug as string | undefined) ?? null}
      savedPublished={(row?.published as boolean | undefined) ?? false}
      siteUrl={process.env.SITE_URL ?? "http://localhost:3000"}
      worksCount={projects.filter((project) => project.portfolio_show).length}
      testimonials={(testimonialRows.data ?? []) as TestimonialRow[]}
      projects={projects.map(({ id, company_name }) => ({ id, company_name }))}
    />
  );
}
