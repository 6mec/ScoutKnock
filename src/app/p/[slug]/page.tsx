import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PortfolioView } from "@/components/portfolio/portfolio-view";
import { ptPT } from "@/i18n/pt-PT";
import { findPortfolio } from "@/lib/portfolio/public";
import { portfolioPath } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  await connection();

  const portfolio = await findPortfolio((await params).slug);
  if (!portfolio) return { robots: { index: false, follow: false } };

  // Título, descrição e imagem para a pré-visualização ao partilhar (WhatsApp e outras).
  // A imagem vem do opengraph-image ao lado. Fora do Google, a não ser que ele ligue.
  const description = portfolio.headline ?? ptPT.portfolio.page.description(portfolio.display_name);
  const indexable = portfolio.indexable === true;
  // O portfólio de HOME_PORTFOLIO_SLUG vive na raiz do domínio: o endereço oficial é "/".
  const path = portfolioPath(portfolio.slug);
  return {
    title: { absolute: portfolio.display_name },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "profile",
      locale: "pt_PT",
      url: path,
      title: portfolio.display_name,
      description,
    },
    twitter: { card: "summary_large_image", title: portfolio.display_name, description },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
  };
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
