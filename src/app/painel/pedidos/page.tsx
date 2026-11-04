import type { Metadata } from "next";
import { Suspense } from "react";
import { PageIntro } from "@/components/app/page-intro";
import { RequestList } from "@/components/requests/request-list";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { requireUser } from "@/lib/auth/current-user";
import { reportError } from "@/lib/events/log";
import { sortRequests, type WorkRequest } from "@/lib/requests/rules";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: ptPT.requests.title,
  robots: { index: false },
};

export default function RequestsPage() {
  return (
    <>
      <PageIntro title={ptPT.pages.requests.title} description={ptPT.pages.requests.description} />
      <Suspense fallback={<Skeleton className="m-4 h-96 rounded-lg lg:m-8" />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_requests")
    .select("id, contact_id, demo_id, company_name, kind, brief, status, result_note, result_url, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) await reportError("pedidos ler", error.code, user.id);

  return <RequestList requests={sortRequests((data ?? []) as WorkRequest[])} />;
}
