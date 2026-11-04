import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ManualRadar } from "@/components/radar/manual-search";
import { RadarScreen } from "@/components/radar/radar-screen";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { isCurrentUserAdmin } from "@/lib/account/admin";
import { requireUser } from "@/lib/auth/current-user";
import { reportError } from "@/lib/events/log";
import { enabledMarkets } from "@/lib/markets";
import { getCompanyProvider } from "@/lib/radar/provider";
import { createClient } from "@/lib/supabase/server";

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

  const user = await requireUser();
  const supabase = await createClient();
  // Só o consumo e os place_id já guardados: nada do Google sai da base de dados.
  const [usage, saved, isAdmin, profile] = await Promise.all([
    supabase.rpc("my_plan_usage").maybeSingle(),
    supabase.from("contacts").select("company_id"),
    isCurrentUserAdmin(supabase),
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
  ]);
  if (usage.error) await reportError("radar uso", usage.error.code, user.id);

  const row = usage.data as { searches_used: number; searches_limit: number } | null;

  return (
    <RadarScreen
      isSample={provider.usesSampleData}
      markets={enabledMarkets()}
      usage={row ? { used: row.searches_used, limit: row.searches_limit } : null}
      isAdmin={isAdmin}
      savedIds={(saved.data ?? []).map(({ company_id }) => company_id as string)}
      senderName={(profile.data?.display_name as string | null | undefined) ?? null}
    />
  );
}
