import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DemoView } from "@/components/demos/demo-view";
import { parseRemovalContact, parseSiteName } from "@/lib/demos/official-rules";
import type { PublicDemo } from "@/lib/demos/rules";
import { reportError } from "@/lib/events/log";
import { createClient } from "@/lib/supabase/server";

async function findSite(value: string) {
  const name = parseSiteName(value);
  if (!name) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("get_official_site", { site_name: name })
    .maybeSingle();

  if (error) await reportError("site oficial", error.code);
  return data ? { name, demo: data as PublicDemo } : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/s/[name]">): Promise<Metadata> {
  await connection();

  const site = await findSite((await params).name);
  return site
    ? { title: { absolute: site.demo.company_name } }
    : { robots: { index: false, follow: false } };
}

export default function OfficialSitePage({ params }: PageProps<"/s/[name]">) {
  return (
    <main className="flex flex-1 flex-col bg-[#FFFFFF]">
      <Suspense>
        <Content params={params} />
      </Suspense>
    </main>
  );
}

async function Content({ params }: Pick<PageProps<"/s/[name]">, "params">) {
  await connection();

  const site = await findSite((await params).name);
  if (!site) notFound();

  return (
    <DemoView
      demo={site.demo}
      official
      removalContact={parseRemovalContact(process.env.OFFICIAL_SITE_REMOVAL_CONTACT)}
    />
  );
}
