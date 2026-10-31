import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { WaitlistForm } from "@/components/waitlist-form";
import { ptPT } from "@/i18n/pt-PT";

const { landing: copy, waitlist } = ptPT;

export const metadata: Metadata = {
  title: copy.meta.title,
  description: copy.meta.description,
};

const primaryButton =
  "inline-flex min-h-12 items-center justify-center rounded-[12px] bg-accent px-5 py-2 text-center font-bold text-accent-contrast transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const secondaryButton =
  "inline-flex min-h-12 items-center justify-center rounded-[12px] border border-border px-5 py-2 text-center font-bold transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const card = "rounded-[12px] border border-border bg-surface p-6";
const sectionTitle = "text-[28px] leading-tight font-bold tracking-tight";
const WAITLIST_HREF = "#lista-de-espera";

function Section({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="mx-auto flex w-full max-w-5xl scroll-mt-6 flex-col gap-6 px-4 py-12 sm:px-6"
    >
      {children}
    </section>
  );
}

function PointList({ points }: { points: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {points.map((point) => (
        <li key={point} className="flex gap-3 leading-[1.6]">
          <span aria-hidden="true" className="text-accent">
            ✓
          </span>
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Logo />
        <nav
          aria-label={copy.nav.label}
          className="flex flex-wrap items-center gap-x-5 gap-y-3"
        >
          <a href="#como-funciona" className="hover:text-accent">
            {copy.nav.howItWorks}
          </a>
          <a href="#perguntas" className="hover:text-accent">
            {copy.nav.faq}
          </a>
          <a href={WAITLIST_HREF} className={secondaryButton}>
            {copy.joinButton}
          </a>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">
        <Section>
          <div className="flex max-w-3xl flex-col items-start gap-6 py-8">
            <p className="rounded-full border border-border px-3 py-1 text-[16px] sm:text-[14px] text-amber">
              {copy.hero.badge}
            </p>
            <h1 className="text-[40px] leading-tight font-bold tracking-tight">
              {copy.hero.title}
            </h1>
            <p className="text-[20px] leading-[1.6] text-muted">
              {copy.hero.subtitle}
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <a href={WAITLIST_HREF} className={primaryButton}>
                {copy.joinButton}
              </a>
              <a href="#como-funciona" className={secondaryButton}>
                {copy.hero.secondary}
              </a>
            </div>
            <p className="text-muted">{copy.hero.note}</p>
          </div>
        </Section>

        <Section>
          <h2 className={sectionTitle}>{copy.audience.title}</h2>
          <p className="max-w-3xl leading-[1.6] text-muted">
            {copy.audience.body}
          </p>
          <ul className="flex flex-wrap gap-2">
            {copy.audience.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-border bg-surface px-3 py-1"
              >
                {tag}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="como-funciona">
          <div className="flex flex-col gap-2">
            <h2 className={sectionTitle}>{copy.howItWorks.title}</h2>
            <p className="text-muted">{copy.futureNote}</p>
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            {copy.howItWorks.steps.map((step, index) => (
              <li key={step.title} className={`${card} flex flex-col gap-3`}>
                <span className="font-mono text-accent">{index + 1}</span>
                <h3 className="text-[20px] font-bold tracking-tight">
                  {step.title}
                </h3>
                <p className="leading-[1.6] text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section>
          <article className={`${card} flex max-w-2xl flex-col gap-4`}>
            <p className="text-[16px] sm:text-[14px] font-bold text-amber">
              {copy.example.badge}
            </p>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h2 className="text-[20px] font-bold tracking-tight">
                {copy.example.company}
              </h2>
              <p className="text-accent">
                {copy.example.scoreLabel}:{" "}
                <span className="font-mono font-bold">
                  {copy.example.score}
                </span>{" "}
                ({copy.example.strength})
              </p>
            </div>
            <dl className="flex flex-col gap-2 leading-[1.6]">
              {copy.example.rows.map((row) => (
                <div key={row.label}>
                  <dt className="inline text-muted">{row.label}: </dt>
                  <dd className="inline">{row.value}</dd>
                </div>
              ))}
              <div>
                <dt className="inline text-muted">
                  {copy.example.suggestionLabel}:{" "}
                </dt>
                <dd className="inline">{copy.example.suggestion}</dd>
              </div>
            </dl>
          </article>
          <p className="text-[16px] sm:text-[14px] text-muted">{copy.example.note}</p>
        </Section>

        <Section>
          <div className="grid gap-10 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h2 className={sectionTitle}>{copy.show.title}</h2>
              <p className="text-muted">{copy.futureNote}</p>
              <p className="leading-[1.6] text-muted">{copy.show.body}</p>
              <PointList points={copy.show.points} />
            </div>
            <div className="flex flex-col gap-4">
              <h2 className={sectionTitle}>{copy.honesty.title}</h2>
              <p className="leading-[1.6] text-muted">{copy.honesty.body}</p>
              <PointList points={copy.honesty.points} />
            </div>
          </div>
        </Section>

        <Section id="lista-de-espera">
          <div className={`${card} mx-auto flex w-full max-w-xl flex-col gap-5`}>
            <div className="flex flex-col gap-2">
              <h2 className={sectionTitle}>{waitlist.title}</h2>
              <p className="leading-[1.6] text-muted">{waitlist.intro}</p>
            </div>
            <WaitlistForm />
          </div>
        </Section>

        <Section id="perguntas">
          <h2 className={sectionTitle}>{copy.faq.title}</h2>
          <div className="flex flex-col gap-3">
            {copy.faq.items.map((item) => (
              <details
                key={item.question}
                className="rounded-[12px] border border-border bg-surface p-4"
              >
                <summary className="cursor-pointer font-bold">
                  {item.question}
                </summary>
                <p className="mt-3 leading-[1.6] text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </Section>

        <Section>
          <div className="flex flex-col items-start gap-4 py-8">
            <h2 className="text-[40px] leading-tight font-bold tracking-tight">
              {copy.finalCta.title}
            </h2>
            <p className="text-[20px] leading-[1.6] text-muted">
              {copy.finalCta.body}
            </p>
            <a href={WAITLIST_HREF} className={primaryButton}>
              {copy.joinButton}
            </a>
          </div>
        </Section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacidade" className="hover:text-accent">
              {copy.footer.privacy}
            </Link>
            <Link href="/termos" className="hover:text-accent">
              {copy.footer.terms}
            </Link>
            <Link href="/contacto" className="hover:text-accent">
              {copy.footer.contact}
            </Link>
          </nav>
          <p className="text-muted">{copy.footer.copyright}</p>
        </div>
      </footer>
    </>
  );
}
