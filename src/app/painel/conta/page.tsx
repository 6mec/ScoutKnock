import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountScreen } from "@/components/account/account-screen";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { requireUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: ptPT.app.account.label,
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <Suspense fallback={<Skeleton className="m-4 h-96 rounded-lg lg:m-8" />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AccountScreen email={user.email} displayName={data?.display_name ?? ""} />
  );
}
