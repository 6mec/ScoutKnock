import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DemoEditor } from "@/components/demos/demo-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { requireUser } from "@/lib/auth/current-user";
import { parseBillingConfig } from "@/lib/billing/rules";
import { officialSiteUrl } from "@/lib/demos/official-rules";
import { OWN_DEMO_COLUMNS, activeDemoFilter, type OwnDemo } from "@/lib/demos/rules";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: ptPT.app.nav.demos,
  robots: { index: false },
};

const dateFormat = new Intl.DateTimeFormat("pt-PT", { dateStyle: "long" });

export default function DemoEditorPage({
  params,
  searchParams,
}: PageProps<"/painel/demos/[id]">) {
  return (
    <Suspense
      fallback={<Skeleton className="m-4 h-96 rounded-lg lg:m-8" />}
    >
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({
  params,
  searchParams,
}: Pick<PageProps<"/painel/demos/[id]">, "params" | "searchParams">) {
  await requireUser();

  const { id } = await params;
  const { publicacao } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("demo_sites")
    .select(OWN_DEMO_COLUMNS)
    .eq("id", id)
    .or(activeDemoFilter())
    .maybeSingle();

  if (!data) notFound();

  const demo = data as unknown as OwnDemo;
  const billing = parseBillingConfig(process.env);
  const site = demo.official_sites;
  const siteUrl = process.env.SITE_URL;

  return (
    <DemoEditor
      demo={demo}
      expiresLabel={
        demo.expires_at
          ? ptPT.demos.expires(dateFormat.format(new Date(demo.expires_at)))
          : null
      }
      publishing={{
        available: Boolean(billing?.officialSite),
        returned: publicacao === "sucesso",
        url:
          site && siteUrl
            ? officialSiteUrl(site.name, {
                siteUrl,
                baseDomain: process.env.OFFICIAL_SITES_BASE_DOMAIN,
              })
            : null,
      }}
    />
  );
}
