import type { Metadata } from "next";
import { Suspense } from "react";
import { ptPT } from "@/i18n/pt-PT";
import { signOut } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/current-user";

const { dashboard: copy } = ptPT;

export const metadata: Metadata = {
  title: copy.title,
  robots: { index: false },
};

export default function DashboardPage() {
  return (
    <main className="flex flex-1 w-full max-w-3xl mx-auto flex-col gap-8 px-4 py-12">
      <h1 className="text-[28px] leading-tight font-bold tracking-tight">
        {copy.title}
      </h1>
      <Suspense fallback={<p className="text-muted">{copy.loading}</p>}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}

async function DashboardContent() {
  const user = await requireUser();

  return (
    <section className="flex flex-col gap-6 rounded-[12px] border border-border bg-surface p-6">
      <p className="text-muted">
        {copy.signedInAs}{" "}
        <span className="break-all text-foreground">{user.email}</span>
      </p>
      <p className="leading-[1.6]">{copy.empty}</p>
      <form action={signOut}>
        <button
          type="submit"
          className="h-12 rounded-[12px] border border-border px-5 font-bold transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {copy.signOut}
        </button>
      </form>
    </section>
  );
}
