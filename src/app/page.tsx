import { Ban, ChevronDown, Send, ShieldCheck, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { DemoWindow } from "@/components/landing/demo-window";
import { Faq } from "@/components/landing/faq";
import { HeroGlobeLazy } from "@/components/landing/hero-globe-lazy";
import { HeroRadar } from "@/components/landing/hero-radar";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingSessionActions } from "@/components/landing/landing-session-actions";
import { RadarRings } from "@/components/landing/radar-rings";
import { RadarSimulation } from "@/components/landing/radar-simulation";
import { Button } from "@/components/ui/button";
import { LiveDot } from "@/components/ui/live-dot";
import { Reveal } from "@/components/ui/reveal";
import { WaitlistForm } from "@/components/waitlist-form";
import { ptPT } from "@/i18n/pt-PT";
import { enabledMarkets } from "@/lib/markets";
import { cn } from "@/lib/utils";

const { landing: copy, waitlist } = ptPT;

export const metadata: Metadata = {
  title: copy.meta.title,
  description: copy.meta.description,
};

const HONESTY_ICONS: LucideIcon[] = [ShieldCheck, Send, Ban];
const WAITLIST_HREF = "#lista-de-espera";
// A landing é gerada no build: mudar MARKETS_ENABLED obriga a publicar de novo.
const WITH_BRAZIL = enabledMarkets().includes("BR");
const NO_SCRIPT_STYLES = "[data-reveal]{opacity:1!important;transform:none!important;filter:none!important}";

function Section({
  id,
  className,
  containerClassName,
  children,
}: {
  id?: string;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-18 border-b border-border", className)}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-300 px-4 py-14 lg:px-10 lg:py-22",
          containerClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

function SectionHeading({
  label,
  title,
  labelClassName = "text-accent",
}: {
  label: string;
  title: string;
  labelClassName?: string;
}) {
  return (
    <>
      <p className={cn("section-label", labelClassName)}>{label}</p>
      <h2 className="type-heading mt-3.5 text-32 lg:text-44">{title}</h2>
    </>
  );
}

function Entrance({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("animate-entrance", className)}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {children}
    </div>
  );
}

function NicheList({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 gap-11 pr-11"
    >
      {copy.niches.map((niche) => (
        <li key={niche} className="flex gap-11">
          <span>{niche}</span>
          <span aria-hidden="true" className="text-accent">
            +
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <div className="overflow-x-clip">
      <noscript>
        <style>{NO_SCRIPT_STYLES}</style>
      </noscript>
      <LandingHeader
        desktopActions={<LandingSessionActions variant="desktop" />}
        barActions={<LandingSessionActions variant="bar" />}
        drawerActions={<LandingSessionActions variant="drawer" />}
      />

      <main id="topo" className="flex flex-col">
        <section className="relative overflow-hidden border-b border-border">
          <RadarRings
            sweep
            className="-top-44 -right-56 size-225 opacity-55"
          />
          <HeroGlobeLazy withBrazil={WITH_BRAZIL} />
          <div className="relative mx-auto flex w-full max-w-300 flex-wrap items-center gap-14 px-4 pt-32 pb-14 lg:px-10 lg:pt-36 lg:pb-24">
            <div className="min-w-0 flex-[1_1_440px]">
              <Entrance index={0}>
                <span className="type-mono inline-flex rounded-pill border border-border bg-surface px-3.5 py-1.5 text-13 text-muted">
                  <LiveDot
                    status="searching"
                    label={copy.hero.badge}
                    className="text-13"
                  />
                </span>
              </Entrance>
              <Entrance index={1}>
                <h1 className="type-display mt-7 text-48 md:text-64 xl:text-84">
                  {copy.hero.titleLead}
                  <span className="text-accent">{copy.hero.titleAccent}</span>
                </h1>
              </Entrance>
              <Entrance index={2}>
                <p className="type-body mt-7 max-w-130 text-18 text-muted lg:text-20">
                  {copy.hero.subtitle}
                </p>
              </Entrance>
              <Entrance
                index={3}
                className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3"
              >
                <Button asChild size="lg">
                  <a href={WAITLIST_HREF}>{copy.joinButton}</a>
                </Button>
                <Button asChild variant="ghost">
                  <a href="#como-funciona">
                    {copy.hero.secondary}
                    <ChevronDown aria-hidden="true" size={16} strokeWidth={1.75} />
                  </a>
                </Button>
              </Entrance>
              <Entrance index={3}>
                <p className="mt-4 text-14 text-muted">{copy.hero.note}</p>
              </Entrance>
            </div>
            <Entrance index={4} className="min-w-0 max-w-140 flex-[1_1_460px]">
              <HeroRadar />
            </Entrance>
          </div>
        </section>

        <div
          aria-hidden="true"
          className="group type-mono overflow-hidden border-b border-border bg-surface py-5 text-14 tracking-[.06em] whitespace-nowrap text-muted uppercase"
        >
          <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
            <NicheList />
            <NicheList hidden />
          </div>
        </div>

        <Section containerClassName="flex flex-wrap gap-x-18 gap-y-10">
          <div className="min-w-0 flex-[1_1_380px]">
            <Reveal onScroll>
              <SectionHeading
                label={copy.sectionLabels.audience}
                title={copy.audience.title}
              />
            </Reveal>
          </div>
          <div className="min-w-0 flex-[1_1_420px]">
            <Reveal onScroll index={1}>
              <p className="type-body text-18 text-muted lg:text-20">
                {copy.audience.body}
              </p>
              <ul className="mt-7 flex flex-wrap gap-2.5">
                {copy.audience.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-pill border border-border bg-surface px-4 py-2 transition-colors duration-(--duration-fast) ease-out hovered:border-accent hovered:text-accent"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Section>

        <Section id="como-funciona" containerClassName="lg:pb-0">
          <SectionHeading
            label={copy.sectionLabels.howItWorks}
            title={copy.howItWorks.title}
          />
          <p className="mt-3 mb-10 text-muted lg:mb-0">{copy.futureNote}</p>
          <HowItWorks />
        </Section>

        <Section containerClassName="flex flex-col gap-10">
          <Reveal onScroll>
            <SectionHeading
              label={copy.sectionLabels.score}
              title={copy.example.title}
            />
            <p className="mt-3 text-muted">{copy.futureNote}</p>
            <p className="type-body mt-5 max-w-200 text-18 text-muted">
              {copy.example.intro} {copy.example.tryIt}
            </p>
          </Reveal>
          <Reveal onScroll index={1}>
            <RadarSimulation />
          </Reveal>
        </Section>

        <Section containerClassName="flex flex-wrap-reverse items-center gap-x-18 gap-y-12">
          <div className="min-w-0 max-w-140 flex-[1_1_440px]">
            <Reveal onScroll>
              <DemoWindow />
            </Reveal>
          </div>
          <div className="min-w-0 flex-[1_1_380px]">
            <Reveal onScroll index={1}>
              <SectionHeading
                label={copy.sectionLabels.demo}
                title={copy.show.title}
              />
              <p className="mt-3 text-muted">{copy.futureNote}</p>
              <p className="type-body mt-5 text-18 text-muted">
                {copy.show.body}
              </p>
              <ul className="mt-7 flex flex-col gap-3.5">
                {copy.show.points.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span aria-hidden="true" className="text-accent">
                      ✓
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Section>

        <Section
          className="bg-surface"
          containerClassName="flex flex-wrap gap-x-18 gap-y-10"
        >
          <div className="min-w-0 flex-[1_1_380px]">
            <Reveal onScroll>
              <SectionHeading
                label={copy.sectionLabels.honesty}
                title={copy.honesty.title}
                labelClassName="text-amber"
              />
              <p className="type-body mt-5 text-18 text-muted">
                {copy.honesty.body}
              </p>
            </Reveal>
          </div>
          <ul className="flex min-w-0 flex-[1_1_380px] flex-col gap-3">
            {copy.honesty.points.map((point, index) => {
              const Icon = HONESTY_ICONS[index];
              return (
                <li key={point}>
                  <Reveal onScroll index={index}>
                    <div className="flex items-start gap-3.5 rounded-md border border-border bg-background px-5 py-5">
                      <Icon
                        aria-hidden="true"
                        size={20}
                        strokeWidth={1.75}
                        className="mt-0.5 shrink-0 text-accent"
                      />
                      {point}
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section
          id="perguntas"
          containerClassName="flex flex-wrap gap-x-18 gap-y-10"
        >
          <div className="min-w-0 flex-[1_1_300px]">
            <SectionHeading
              label={copy.sectionLabels.faq}
              title={copy.faq.title}
            />
          </div>
          <div className="min-w-0 flex-[2_1_520px]">
            <Faq withBrazil={WITH_BRAZIL} />
          </div>
        </Section>

        <section
          id="lista-de-espera"
          className="relative scroll-mt-18 overflow-hidden"
        >
          <RadarRings className="-bottom-72 -left-64 size-190 opacity-50" />
          <div className="relative mx-auto flex w-full max-w-300 flex-wrap items-center gap-x-18 gap-y-12 px-4 py-14 lg:px-10 lg:py-24">
            <div className="min-w-0 flex-[1_1_380px]">
              <h2 className="type-display text-48 lg:text-64">
                {copy.finalCta.titleLead}
                <span className="text-accent">{copy.finalCta.titleAccent}</span>
              </h2>
              <p className="type-body mt-5 text-20 text-muted">
                {copy.finalCta.body}
              </p>
            </div>
            <div className="min-w-0 max-w-130 flex-[1_1_420px] rounded-lg border border-border bg-surface p-6 lg:p-8">
              <h3 className="type-heading text-24">{waitlist.title}</h3>
              <p className="mt-2 mb-6 text-muted">{waitlist.intro}</p>
              <WaitlistForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-300 flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-7 text-14 text-muted lg:px-10">
          <span>{copy.footer.copyright}</span>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              ["/privacidade", copy.footer.privacy],
              ["/termos", copy.footer.terms],
              ["/contacto", copy.footer.contact],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="focus-ring inline-flex min-h-11 items-center rounded-sm hovered:text-foreground"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
