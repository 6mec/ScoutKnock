import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DemoView } from "@/components/demos/demo-view";
import { ptPT } from "@/i18n/pt-PT";
import type { PublicDemo } from "@/lib/demos/rules";
import { reportError } from "@/lib/events/log";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: ptPT.demos.unofficial,
  robots: { index: false, follow: false },
};

export default function PublicDemoPage({ params }: PageProps<"/demo/[slug]">) {
  return (
    <main className="flex flex-1 flex-col bg-[#FFFFFF]">
      <Suspense>
        <Content params={params} />
      </Suspense>
    </main>
  );
}

async function Content({ params }: Pick<PageProps<"/demo/[slug]">, "params">) {
  await connection();

  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("get_public_demo", { demo_slug: slug })
    .maybeSingle();

  if (error) await reportError("demo pública", error.code);
  if (!data) {
    // Publicada entretanto: o link antigo que a empresa recebeu continua a servir.
    const { data: name } = await supabase.rpc("official_name_for_demo", {
      demo_slug: slug,
    });
    if (name) redirect(`/s/${name as string}`);
    notFound();
  }

  return <DemoView demo={data as PublicDemo} />;
}
