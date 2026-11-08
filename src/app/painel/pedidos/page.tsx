import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageIntro } from "@/components/app/page-intro";
import { RequestList } from "@/components/requests/request-list";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { reportError } from "@/lib/events/log";
import { sortRequests, type WorkRequest } from "@/lib/requests/rules";
import { createClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/team/access";

export const metadata: Metadata = {
  title: ptPT.requests.title,
  robots: { index: false },
};

// Os Pedidos são um separador dos Projetos (T16): para o dono, este endereço reencaminha.
// O Comercial não vê projetos, por isso abre aqui só a lista dos pedidos.
export default function RequestsPage() {
  return (
    <>
      <PageIntro title={ptPT.requests.title} description={ptPT.requests.description} />
      <Suspense fallback={<Skeleton className="m-4 h-96 rounded-lg lg:m-8" />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  const access = await getAccess();
  if (access.role === "owner") redirect("/painel/projetos?separador=pedidos");
  const supabase = await createClient();
  const requests = await supabase
    .from("work_requests")
    .select("id, contact_id, demo_id, company_name, kind, brief, status, result_note, result_url, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (requests.error) await reportError("pedidos ler", requests.error.code, access.userId);
  return <RequestList requests={sortRequests((requests.data ?? []) as WorkRequest[])} />;
}
