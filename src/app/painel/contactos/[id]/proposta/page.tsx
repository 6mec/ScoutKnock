import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProposalEditor } from "@/components/contacts/proposal-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { requireUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: ptPT.proposal.title,
  robots: { index: false },
};

export default function ProposalPage({ params }: PageProps<"/painel/contactos/[id]/proposta">) {
  return (
    <Suspense fallback={<Skeleton className="m-4 h-96 rounded-lg lg:m-8" />}>
      <Content params={params} />
    </Suspense>
  );
}

// Só lê o contacto e o perfil: a proposta monta-se no browser e não se guarda.
async function Content({ params }: Pick<PageProps<"/painel/contactos/[id]/proposta">, "params">) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: contact }, { data: profile }] = await Promise.all([
    supabase.from("contacts").select("id, label, deal_value").eq("id", id).maybeSingle(),
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
  ]);
  if (!contact) notFound();

  return (
    <ProposalEditor
      contactId={contact.id as string}
      clientName={contact.label as string}
      dealValue={(contact.deal_value as number | null) ?? null}
      yourName={(profile?.display_name as string | null) ?? ""}
      yourContact={user.email ?? ""}
    />
  );
}
