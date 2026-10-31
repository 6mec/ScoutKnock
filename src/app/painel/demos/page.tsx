import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DemoView } from "@/components/demos/demo-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { requireUser } from "@/lib/auth/current-user";
import type { OwnDemo } from "@/lib/demos/rules";
import { createClient } from "@/lib/supabase/server";

const { demos: copy } = ptPT;

export const metadata: Metadata = {
  title: ptPT.app.nav.demos,
  robots: { index: false },
};

const dateFormat = new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" });

export default function DemosPage() {
  return (
    <div className="mx-auto w-full max-w-300 px-4 py-8 lg:px-8">
      <Suspense fallback={<Skeleton className="h-72 w-full rounded-lg" />}>
        <Gallery />
      </Suspense>
    </div>
  );
}

async function Gallery() {
  await requireUser();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("demo_sites")
    .select("*")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`demos galeria: ${error.code}`);
    return <p role="alert">{copy.errors.generic}</p>;
  }

  const demos = data as OwnDemo[];

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
            className="focus-ring group block overflow-hidden rounded-lg border border-border bg-surface transition-colors duration-(--duration-fast) ease-out hovered:border-border-input"
          >
            <div aria-hidden="true" inert className="h-44 overflow-hidden">
              <div className="pointer-events-none w-[250%] origin-top-left scale-40">
                <DemoView demo={demo} preview />
              </div>
            </div>
            <div className="relative flex flex-col gap-2 border-t border-border bg-surface p-4">
              <p className="truncate font-semibold">{demo.company_name}</p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant={demo.status === "sent" ? "accent" : "outline"}>
                  {copy.status[demo.status]}
                </Badge>
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
