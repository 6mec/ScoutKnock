import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

export function AuthCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="flex flex-1 w-full max-w-md mx-auto flex-col justify-center gap-8 px-4 py-12">
      <Logo />
      <section className="flex flex-col gap-6 rounded-[12px] border border-border bg-surface p-6">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">
          {title}
        </h1>
        {children}
      </section>
    </main>
  );
}
