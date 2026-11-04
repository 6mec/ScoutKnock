import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ManualRadar } from "@/components/radar/manual-search";
import { RadarScreen } from "@/components/radar/radar-screen";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { enabledMarkets } from "@/lib/markets";
import { getCompanyProvider } from "@/lib/radar/provider";

const { radar: copy } = ptPT;

export const metadata: Metadata = {
  title: copy.title,
  robots: { index: false },
};

export default function RadarPage() {
  return (
    <Suspense fallback={<Skeleton className="m-4 h-96 rounded-lg lg:m-8" />}>
      <Content />
    </Suspense>
  );
}

// No pedido, e não no build: a chave do fornecedor pode mudar sem novo build.
async function Content() {
  await connection();

  const provider = getCompanyProvider();

  if (!provider) return <ManualRadar />;

  return (
    <RadarScreen isSample={provider.usesSampleData} markets={enabledMarkets()} />
  );
}
