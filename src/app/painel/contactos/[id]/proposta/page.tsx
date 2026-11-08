import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageIntro } from "@/components/app/page-intro";
import { ProposalEditor } from "@/components/contacts/proposal-editor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { requireUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { todayIn } from "@/lib/demos/booking";

export const metadata: Metadata = {
  title: ptPT.proposal.title,
  robots: { index: false },
};

export default function ProposalPage({ params, searchParams }: PageProps<"/painel/contactos/[id]/proposta">) {
  return (
    <>
      <PageIntro
        title={ptPT.proposal.title}
        description={ptPT.proposal.intro}
        className="print:hidden"
        before={
          <Button asChild variant="ghost" size="sm" className="mb-2 self-start">
            <Link href="/painel/contactos">
              <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.75} />
              {ptPT.proposal.back}
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<Skeleton className="m-4 h-96 rounded-lg lg:m-8" />}>
        <Content params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

// Só lê o contacto e o perfil: a proposta monta-se no browser e não se guarda.
async function Content({ params, searchParams }: Pick<PageProps<"/painel/contactos/[id]/proposta">, "params" | "searchParams">) {
  const user = await requireUser();
  const { id } = await params;
  const { proposta } = await searchParams;
  const supabase = await createClient();
  const [{ data: contact }, { data: profile }, { data: portfolio }] = await Promise.all([
    supabase.from("contacts").select("id, label, deal_value").eq("id", id).maybeSingle(),
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("portfolios").select("display_name").eq("user_id", user.id).maybeSingle(),
  ]);
  if (!contact) notFound();
  const registered =
    typeof proposta === "string" && /^[0-9a-f-]{36}$/i.test(proposta)
      ? (await supabase.from("proposals").select("service, value, valid_until").eq("id", proposta).eq("contact_id", id).maybeSingle()).data
      : null;
  const today = todayIn();
  const validDays =
    registered?.valid_until && (registered.valid_until as string) >= today
      ? Math.round((Date.parse(registered.valid_until as string) - Date.parse(today)) / 86_400_000)
      : null;

  return (
    <ProposalEditor
      contactId={contact.id as string}
      clientName={contact.label as string}
      dealValue={(contact.deal_value as number | null) ?? null}
      yourName={((profile?.display_name as string | null) || (portfolio?.display_name as string | null) || "").trim()}
      yourContact={user.email ?? ""}
      registered={registered ? { service: registered.service as string, value: Number(registered.value), validDays } : null}
    />
  );
}
