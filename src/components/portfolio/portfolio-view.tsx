import {
  ArrowUpRight,
  Bot,
  CalendarCheck,
  Globe,
  Hammer,
  LayoutGrid,
  Mail,
  MapPin,
  MessageCircle,
  RefreshCw,
  ShoppingBag,
  Smartphone,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { ptPT } from "@/i18n/pt-PT";
import { whatsappUrl } from "@/lib/messages/rules";
import { publicImageUrl } from "@/lib/portfolio/images";
import type { PortfolioStep, PublicPortfolio } from "@/lib/portfolio/rules";
import { cn } from "@/lib/utils";
import { WhatsAppBar } from "./whatsapp-bar";

const copy = ptPT.portfolio.page;
const values = ptPT.portfolio.values;
const KINDS = ptPT.projects.kinds;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Uma só cor de destaque (o verde do ScoutKnock) e uma escala fixa de texto e espaços.
const card = "rounded-2xl border border-[#e3e8ee] bg-white shadow-[0_1px_2px_rgba(11,15,20,0.04),0_8px_24px_-12px_rgba(11,15,20,0.08)]";
const muted = "text-[#566273]";
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a7f5b]";

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// Ícone do serviço pelas palavras do título; sem correspondência, um ícone geral.
const SERVICE_ICONS: [RegExp, LucideIcon][] = [
  [/automa|\bia\b|intelig|chatbot|bot\b/i, Bot],
  [/marca[çc]|agenda|reserva/i, CalendarCheck],
  [/\bapps?\b|aplica/i, Smartphone],
  [/loja|venda|e-?commerce|shop/i, ShoppingBag],
  [/manuten|suporte|apoio/i, Wrench],
  [/site|p[áa]gina|web/i, Globe],
];
function serviceIcon(title: string) {
  return SERVICE_ICONS.find(([pattern]) => pattern.test(title))?.[1] ?? LayoutGrid;
}

function Section({
  slug,
  id,
  title,
  as: Title,
  children,
  className,
}: {
  slug: string;
  id: string;
  title: string;
  as: "h2" | "h4";
  children: ReactNode;
  className?: string;
}) {
  const headingId = `${slug}-${id}`;
  return (
    <section aria-labelledby={headingId} data-testid={`pf-section-${id}`} className={cn("flex flex-col gap-6 sm:gap-8", className)}>
      <Title id={headingId} className="text-24 leading-tight font-bold tracking-tight sm:text-32">
        {title}
      </Title>
      {children}
    </section>
  );
}

// A página pública do freelancer. Paleta clara fixa: é a montra dele, não a app.
// Só mostra o que ele escreveu; cada secção sem conteúdo não aparece.
export function PortfolioView({ portfolio, preview = false }: { portfolio: PublicPortfolio; preview?: boolean }) {
  const { display_name: name, headline, about, city, whatsapp, email, services, slug } = portfolio;
  const works = portfolio.works ?? [];
  const testimonials = portfolio.testimonials ?? [];
  const steps: readonly PortfolioStep[] = portfolio.process_steps?.length ? portfolio.process_steps : ptPT.portfolio.defaultSteps;
  const Heading = preview ? "h3" : "h1";
  const Title = preview ? "h4" : "h2";
  const Sub = preview ? "h5" : "h3";
  // Na pré-visualização do editor não há animações nem barra fixa.
  const reveal = preview ? "" : "pf-reveal";
  const whatsappHref = whatsapp ? whatsappUrl(copy.whatsappMessage, whatsapp) : null;
  const heroId = `${slug}-topo`;
  const contactId = `${slug}-contacto`;

  const buttons = (dark: boolean) =>
    (whatsappHref || email) && (
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer noopener"
            className={cn(
              "inline-flex min-h-14 items-center justify-center gap-2.5 rounded-xl bg-[#0a7f5b] px-7 text-16 font-semibold text-white shadow-[0_8px_20px_-8px_rgba(10,127,91,0.6)] transition-[background-color,transform] duration-200 hover:bg-[#086b4c] motion-safe:hover:-translate-y-0.5",
              focus,
              dark && "focus-visible:outline-white",
            )}
          >
            <MessageCircle aria-hidden="true" size={20} strokeWidth={1.9} />
            {copy.whatsapp}
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className={cn(
              "inline-flex min-h-14 items-center justify-center gap-2.5 rounded-xl border px-7 text-16 font-medium transition-colors duration-200",
              dark ? "border-white/25 text-white hover:border-white/60" : "border-[#cbd3dd] bg-white text-[#0b0f14] hover:border-[#0a7f5b]",
              focus,
              dark && "focus-visible:outline-white",
            )}
          >
            <Mail aria-hidden="true" size={20} strokeWidth={1.9} />
            {copy.email}
          </a>
        )}
      </div>
    );

  return (
    <div
      data-testid="portfolio-view"
      className={cn("bg-[#f7f9fb] text-[#0b0f14]", preview ? "rounded-lg" : "min-h-dvh", !preview && whatsappHref && "pb-24 sm:pb-0")}
    >
      {/* Topo: quem é, o que faz e a ação principal. */}
      <header id={heroId} className="relative overflow-hidden border-b border-[#e3e8ee] bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_100%_0%,rgba(10,127,91,0.10),transparent_65%),radial-gradient(60%_50%_at_0%_100%,rgba(10,127,91,0.05),transparent_70%)]"
        />
        <div aria-hidden="true" className="pf-dots pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex max-w-5xl flex-col gap-8 px-5 pt-16 pb-14 sm:px-8 sm:pt-24 sm:pb-20">
          <span
            aria-hidden="true"
            className="inline-flex size-18 items-center justify-center rounded-full bg-[#0a7f5b] text-24 font-bold tracking-tight text-white shadow-[0_0_0_6px_rgba(10,127,91,0.12)]"
          >
            {initialsOf(name)}
          </span>
          <div className="flex max-w-3xl flex-col gap-4">
            <Heading className="text-32 leading-[1.1] font-bold tracking-tight text-balance sm:text-44">{name}</Heading>
            {headline && <p className="text-18 leading-relaxed text-pretty text-[#3d4754] sm:text-24 sm:leading-snug">{headline}</p>}
            {city && (
              <p className={cn("inline-flex items-center gap-1.5 text-14", muted)}>
                <MapPin aria-hidden="true" size={16} strokeWidth={1.9} />
                {city}
              </p>
            )}
          </div>
          {buttons(false)}
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col gap-20 px-5 py-16 sm:gap-24 sm:px-8 sm:py-24">
        {services.length > 0 && (
          <Section slug={slug} as={Title} id="servicos" title={copy.services}>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => {
                const Icon = serviceIcon(service.title);
                return (
                  <li
                    key={service.title}
                    className={cn(card, reveal, "flex flex-col gap-3 p-6 transition-[border-color,transform] duration-200 hover:border-[#0a7f5b]/40 motion-safe:hover:-translate-y-0.5")}
                  >
                    <span aria-hidden="true" className="inline-flex size-11 items-center justify-center rounded-xl bg-[#e6f4ef] text-[#0a7f5b]">
                      <Icon size={22} strokeWidth={1.8} />
                    </span>
                    <Sub className="text-18 font-semibold">{service.title}</Sub>
                    {service.description && <p className={cn("text-16 leading-relaxed", muted)}>{service.description}</p>}
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        {works.length > 0 && (
          <Section slug={slug} as={Title} id="trabalhos" title={copy.work}>
            <ul className={cn("grid gap-6", works.length > 1 && "lg:grid-cols-2")}>
              {works.map((work, index) => {
                const image = work.image && SUPABASE_URL ? publicImageUrl(work.image, SUPABASE_URL) : null;
                // Um só trabalho no computador: captura e texto lado a lado.
                const wide = works.length === 1 && image;
                return (
                  <li
                    key={work.id}
                    data-testid="pf-work"
                    className={cn(
                      card,
                      reveal,
                      "flex flex-col gap-5 p-4 sm:p-5",
                      wide && "lg:grid lg:grid-cols-[3fr_2fr] lg:items-center lg:gap-8",
                      !image && "border-l-4 border-l-[#0a7f5b] p-6 sm:p-8",
                    )}
                  >
                    {image && (
                      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-[#e3e8ee] bg-[#eef1f5] shadow-[0_12px_32px_-16px_rgba(11,15,20,0.35)]">
                        <Image
                          src={image}
                          alt={copy.imageAlt(work.company_name)}
                          fill
                          sizes={wide ? "(min-width: 1024px) 560px, 100vw" : "(min-width: 1024px) 470px, 100vw"}
                          className="object-cover object-top"
                          priority={!preview && index < 2}
                        />
                      </div>
                    )}
                    <div className={cn("flex flex-1 flex-col items-start gap-3", image && "px-1 pb-1 sm:px-2")}>
                      <span className="rounded-full bg-[#e6f4ef] px-3 py-1 text-13 font-semibold text-[#086b4c]">{KINDS[work.kind]}</span>
                      <Sub className="text-24 leading-tight font-bold tracking-tight">{work.company_name}</Sub>
                      {work.summary && <p className={cn("text-16 leading-relaxed", muted)}>{work.summary}</p>}
                      {work.url && (
                        <a
                          href={work.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={copy.visitLabel(work.company_name)}
                          className={cn(
                            "mt-2 inline-flex min-h-12 items-center gap-1.5 rounded-xl border border-[#cbd3dd] bg-white px-5 text-15 font-semibold text-[#0b0f14] transition-colors duration-200 hover:border-[#0a7f5b] hover:text-[#086b4c]",
                            focus,
                          )}
                        >
                          {copy.visitSite}
                          <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.9} />
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        <Section slug={slug} as={Title} id="como-trabalho" title={copy.process}>
          {/* Telemóvel: linha de tempo vertical. Computador: os 4 passos em linha. */}
          <ol className="relative grid gap-8 lg:grid-cols-4 lg:gap-6">
            <span
              aria-hidden="true"
              className="absolute top-5 bottom-5 left-5 w-px bg-[#cfe9df] lg:right-[12.5%] lg:bottom-auto lg:left-[12.5%] lg:h-px lg:w-auto"
            />
            {steps.map((step, index) => (
              <li key={`${index}-${step.title}`} className={cn(reveal, "relative flex gap-5 lg:flex-col lg:items-center lg:gap-4 lg:text-center")}>
                <span
                  aria-hidden="true"
                  className="relative z-10 inline-flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-[#0a7f5b] bg-white text-16 font-bold text-[#0a7f5b] tabular-nums"
                >
                  {index + 1}
                </span>
                <div className="flex flex-col gap-1.5 pt-1.5 lg:pt-0">
                  <Sub className="text-18 font-semibold">{step.title}</Sub>
                  <p className={cn("text-16 leading-relaxed", muted)}>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <section aria-labelledby={`${slug}-valores`} className="flex flex-col gap-6 sm:gap-8" data-testid="pf-values">
          <Title id={`${slug}-valores`} className="text-24 leading-tight font-bold tracking-tight sm:text-32">
            {copy.values}
          </Title>
          <dl className="grid gap-4 sm:grid-cols-3">
            {(
              [
                [Hammer, values.build, values.buildText],
                [Globe, values.thirdParty, values.thirdPartyText],
                [RefreshCw, values.maintenance, values.maintenanceText],
              ] as const
            ).map(([Icon, term, text]) => (
              <div key={term} className={cn(card, reveal, "flex flex-col gap-3 p-6")}>
                <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-xl bg-[#e6f4ef] text-[#0a7f5b]">
                  <Icon size={20} strokeWidth={1.8} />
                </span>
                <dt className="text-18 font-semibold">{term}</dt>
                <dd className={cn("text-16 leading-relaxed", muted)}>{text}</dd>
              </div>
            ))}
          </dl>
          {portfolio.price_from && (
            <p className="text-18 font-semibold" data-testid="pf-price-from">
              {values.priceFromLabel(portfolio.price_from)}
            </p>
          )}
        </section>

        {testimonials.length > 0 && (
          <Section slug={slug} as={Title} id="opinioes" title={copy.testimonials}>
            <ul className="grid gap-4 sm:grid-cols-2">
              {testimonials.map((item) => (
                <li key={`${item.first_name}-${item.quote.slice(0, 20)}`} className={cn(card, reveal, "relative overflow-hidden p-6 sm:p-8")}>
                  <span aria-hidden="true" className="pointer-events-none absolute -top-4 left-4 font-serif text-[120px] leading-none text-[#0a7f5b]/15 select-none">
                    “
                  </span>
                  <figure className="relative flex flex-col gap-4 pt-6">
                    <blockquote className="text-18 leading-relaxed">{item.quote}</blockquote>
                    <figcaption className={cn("text-14 font-semibold", muted)}>{copy.testimonialBy(item.first_name, item.company)}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Fecho: sobre e chamada para falar, num bloco escuro. */}
        {(about || whatsappHref || email) && (
          <div className="flex flex-col gap-10 rounded-3xl bg-[#0b0f14] px-6 py-10 text-white sm:px-12 sm:py-14">
            {about && (
              <section aria-labelledby={`${slug}-sobre`} data-testid="pf-section-sobre" className="flex flex-col gap-4">
                <Title id={`${slug}-sobre`} className="text-14 font-semibold tracking-[0.08em] text-[#7fd8b6] uppercase">
                  {copy.about}
                </Title>
                <p className="max-w-3xl text-18 leading-relaxed whitespace-pre-line text-white/85">{about}</p>
              </section>
            )}
            {(whatsappHref || email) && (
              <section
                aria-labelledby={contactId}
                data-testid="pf-section-contacto"
                className={cn("flex flex-col gap-6", about && "border-t border-white/10 pt-10")}
              >
                <div id={`${contactId}-zona`} className="flex flex-col gap-3">
                  <Title id={contactId} className="text-32 leading-tight font-bold tracking-tight text-balance sm:text-44">
                    {copy.ctaTitle}
                  </Title>
                  <p className="text-18 text-white/75">{copy.ctaText}</p>
                  {city && (
                    <p className="inline-flex items-center gap-1.5 text-14 text-white/70">
                      <MapPin aria-hidden="true" size={16} strokeWidth={1.9} />
                      {city}
                    </p>
                  )}
                </div>
                {buttons(true)}
              </section>
            )}
          </div>
        )}
      </div>

      {!preview && whatsappHref && <WhatsAppBar href={whatsappHref} heroId={heroId} contactId={`${contactId}-zona`} />}
    </div>
  );
}
