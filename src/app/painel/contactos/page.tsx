import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactsScreen } from "@/components/contacts/contacts-screen";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { requireUser } from "@/lib/auth/current-user";
import type { Contact } from "@/lib/contacts/rules";
import { parseStatusFilter } from "@/lib/dashboard/rules";
import { reportError } from "@/lib/events/log";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: ptPT.app.nav.contacts,
  robots: { index: false },
};

export default function ContactsPage({
  searchParams,
}: PageProps<"/painel/contactos">) {
  return (
    <Suspense fallback={<Skeleton className="m-4 h-96 rounded-lg lg:m-8" />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({
  searchParams,
}: Pick<PageProps<"/painel/contactos">, "searchParams">) {
  const user = await requireUser();
  const { estado } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    await reportError("contactos lista", error.code, user.id);
    return (
      <p role="alert" className="px-4 py-8 lg:px-8">
        {ptPT.contacts.errors.generic}
      </p>
    );
  }

  return <ContactsScreen initial={data as Contact[]} statusFilter={parseStatusFilter(estado)} />;
}
