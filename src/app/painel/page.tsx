import type { Metadata } from "next";
import { NewSearchLink } from "@/components/app/new-search-link";
import { ptPT } from "@/i18n/pt-PT";

const { dashboard: copy } = ptPT;

export const metadata: Metadata = {
  title: ptPT.app.nav.home,
  robots: { index: false },
};

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-10 lg:px-8 lg:py-14">
      <div className="flex flex-col items-start gap-6">
        <h2 className="type-heading text-32 lg:text-44">{copy.greeting}</h2>
        <NewSearchLink>{copy.newSearch}</NewSearchLink>
      </div>
      <ol className="grid gap-3 md:grid-cols-3">
        {copy.steps.map((step, index) => (
          <li
            key={step}
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5"
          >
            <span className="type-number text-14 text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="type-body">{step}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
