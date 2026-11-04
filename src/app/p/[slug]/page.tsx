import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PortfolioView } from "@/components/portfolio/portfolio-view";
import { parseSiteName } from "@/lib/demos/official-rules";
import { reportError } from "@/lib/events/log";
import type { PublicPortfolio } from "@/lib/portfolio/rules";
import { createClient } from "@/lib/supabase/server";

// Só os portfólios publicados, pela função que devolve apenas os campos públicos.
async function findPortfolio(value: string) {
  const slug = parseSiteName(value);
  if (!slug) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_portfolio", { portfolio_slug: slug });
  if (error) await reportError("portfolio publico", error.code);
  return (data as PublicPortfolio | null) ?? null;
}

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  await connection();

  const portfolio = await findPortfolio((await params).slug);
  return portfolio
    ? {
        title: { absolute: portfolio.display_name },
        description: portfolio.headline ?? undefined,
        robots: { index: false, follow: false },
      }
    : { robots: { index: false, follow: false } };
}

export default function PortfolioPage({ params }: PageProps<"/p/[slug]">) {
  return (
    <main className="flex flex-1 flex-col bg-[#f7f9fb]">
      <Suspense>
        <Content params={params} />
      </Suspense>
    </main>
  );
}

async function Content({ params }: Pick<PageProps<"/p/[slug]">, "params">) {
  await connection();

  const portfolio = await findPortfolio((await params).slug);
  if (!portfolio) notFound();

  return <PortfolioView portfolio={portfolio} />;
}
