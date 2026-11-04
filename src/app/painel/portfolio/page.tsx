import type { Metadata } from "next";
import { Suspense } from "react";
import { PortfolioEditor, type PortfolioFormValues } from "@/components/portfolio/portfolio-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { requireUser } from "@/lib/auth/current-user";
import { reportError } from "@/lib/events/log";
import { suggestSlug, type PortfolioProject, type PortfolioService } from "@/lib/portfolio/rules";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: ptPT.portfolio.title,
  robots: { index: false },
};

export default function PortfolioPage() {
  return (
    <Suspense fallback={<Skeleton className="m-4 h-96 rounded-lg lg:m-8" />}>
      <Content />
    </Suspense>
  );
}

// Só lê a base de dados: o portfólio, o nome do perfil e os sites oficiais no ar.
async function Content() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: row, error }, { data: profile }, { data: sites }] = await Promise.all([
    supabase.from("portfolios").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("official_sites")
      .select("name, status, demo_sites(company_name)")
      .in("status", ["active", "past_due"]),
  ]);
  if (error) await reportError("portfolio ler", error.code, user.id);

  const name = (row?.display_name as string | undefined) ?? (profile?.display_name as string | null) ?? "";
  const initial: PortfolioFormValues = {
    slug: (row?.slug as string | undefined) ?? suggestSlug(name),
    published: (row?.published as boolean | undefined) ?? false,
    displayName: name,
    headline: (row?.headline as string | null) ?? "",
    about: (row?.about as string | null) ?? "",
    city: (row?.city as string | null) ?? "",
    whatsapp: (row?.whatsapp as string | null) ?? "",
    email: (row?.email as string | null) ?? user.email ?? "",
    services: ((row?.services as PortfolioService[] | undefined) ?? []).map((s) => ({
      title: s.title,
      description: s.description ?? "",
    })),
    projects: ((row?.projects as PortfolioProject[] | undefined) ?? []).map((p) => ({
      title: p.title,
      description: p.description ?? "",
      url: p.url ?? "",
    })),
    showSites: (row?.show_sites as boolean | undefined) ?? true,
  };
  // Sem nada escrito, começa com uma linha vazia em cada lista.
  if (initial.services.length === 0) initial.services.push({ title: "", description: "" });
  if (initial.projects.length === 0) initial.projects.push({ title: "", description: "", url: "" });

  return (
    <PortfolioEditor
      initial={initial}
      savedSlug={(row?.slug as string | undefined) ?? null}
      savedPublished={(row?.published as boolean | undefined) ?? false}
      sites={(sites ?? []).map((site) => ({
        name: site.name as string,
        company_name:
          (site.demo_sites as unknown as { company_name: string } | null)?.company_name ?? site.name,
      }))}
      siteUrl={process.env.SITE_URL ?? "http://localhost:3000"}
    />
  );
}
