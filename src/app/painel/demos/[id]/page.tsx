import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DemoEditor } from "@/components/demos/demo-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { requireUser } from "@/lib/auth/current-user";
import type { OwnDemo } from "@/lib/demos/rules";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: ptPT.app.nav.demos,
  robots: { index: false },
};

const dateFormat = new Intl.DateTimeFormat("pt-PT", { dateStyle: "long" });

export default function DemoEditorPage({
  params,
}: PageProps<"/painel/demos/[id]">) {
  return (
    <Suspense
      fallback={<Skeleton className="m-4 h-96 rounded-lg lg:m-8" />}
    >
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/painel/demos/[id]">, "params">) {
  await requireUser();

  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("demo_sites")
    .select("*")
    .eq("id", id)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!data) notFound();

  const demo = data as OwnDemo;

  return (
    <DemoEditor
      demo={demo}
      expiresLabel={ptPT.demos.expires(dateFormat.format(new Date(demo.expires_at)))}
    />
  );
}
