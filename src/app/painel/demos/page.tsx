import type { Metadata } from "next";
import { PageIntro } from "@/components/app/page-intro";
import Link from "next/link";
import { Suspense } from "react";
import { DemoView } from "@/components/demos/demo-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { requireUser } from "@/lib/auth/current-user";
import { isLive } from "@/lib/demos/official-rules";
import { OWN_DEMO_COLUMNS, activeDemoFilter, type OwnDemo } from "@/lib/demos/rules";
import { reportError } from "@/lib/events/log";
import { createClient } from "@/lib/supabase/server";

const { demos: copy } = ptPT;

export const metadata: Metadata = {
  title: ptPT.app.nav.demos,
  robots: { index: false },
};

const dateFormat = new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" });

export default function DemosPage() {
  return (
    <div className="mx-auto flex w-full max-w-300 flex-col gap-6 px-4 py-8 lg:px-8">
      <PageIntro
        title={ptPT.pages.demos.title}
        description={ptPT.pages.demos.description}
        className="p-0 lg:p-0"
      />
      <Suspense fallback={<Skeleton className="h-72 w-full rounded-lg" />}>
        <Gallery />
      </Suspense>
    </div>
  );
}

async function Gallery() {
  const user = await requireUser();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("demo_sites")
    .select(OWN_DEMO_COLUMNS)
    .or(activeDemoFilter())
    .order("created_at", { ascending: false });

  if (error) {
    await reportError("demos galeria", error.code, user.id);
    return <p role="alert">{copy.errors.generic}</p>;
  }

  const demos = data as unknown as OwnDemo[];

  if (demos.length === 0) {
    return (
      <EmptyState
        title={copy.empty}
        className="bg-surface"
        action={
          <Button asChild variant="secondary">
            <Link href="/painel/radar">{ptPT.app.commands.goRadar}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {demos.map((demo) => (
        <li key={demo.id}>
          <Link
            href={`/painel/demos/${demo.id}`}
            className="focus-ring group block overflow-hidden panel transition-colors duration-(--duration-fast) ease-out hovered:border-border-input"
          >
            <div aria-hidden="true" inert className="h-44 overflow-hidden">
              <div className="pointer-events-none w-[250%] origin-top-left scale-40">
                <DemoView
                  demo={demo}
                  preview
                  official={isLive(demo.official_sites)}
                />
              </div>
            </div>
            <div className="relative flex flex-col gap-2 border-t border-border bg-surface p-4">
              <p className="truncate font-semibold">{demo.company_name}</p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                {isLive(demo.official_sites) ? (
                  <Badge variant="accent">{copy.official.badge}</Badge>
                ) : (
                  <Badge variant={demo.status === "sent" ? "accent" : "outline"}>
                    {copy.status[demo.status]}
                  </Badge>
                )}
                <span className="type-number text-12 text-muted">
                  {dateFormat.format(new Date(demo.created_at))}
                </span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
