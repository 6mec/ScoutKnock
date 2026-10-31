import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DemoView } from "@/components/demos/demo-view";
import { ptPT } from "@/i18n/pt-PT";
import type { PublicDemo } from "@/lib/demos/rules";
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

  if (error) console.error(`demo pública: ${error.code}`);
  if (!data) notFound();

  return <DemoView demo={data as PublicDemo} />;
}
