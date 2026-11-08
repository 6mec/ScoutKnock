import {
  ArrowDown,
  ArrowUpRight,
  Bot,
  CalendarCheck,
  ClipboardList,
  Globe,
  LayoutGrid,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
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
import { TECHNOLOGIES } from "@/lib/portfolio/showcase";
import { cn } from "@/lib/utils";
import { BookingDemo } from "./public/booking-demo";
import { ProjectBuilder } from "./public/project-builder";
import { PublicNav } from "./public/public-nav";
import { SitePreview } from "./public/site-preview";
import { pf } from "./public/styles";
import { WhatsAppBar } from "./whatsapp-bar";

const copy = ptPT.portfolio.page;
const show = ptPT.portfolio.showcase;
const values = ptPT.portfolio.values;
const KINDS = ptPT.projects.kinds;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

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

function hostOf(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

const two = (n: number) => String(n).padStart(2, "0");

// Cabeçalho de secção: etiqueta pequena em verde, título e texto opcional.
function Head({ id, eyebrow, as: Tag, children, text, center = false }: { id: string; eyebrow: string; as: "h2" | "h4"; children: ReactNode; text?: string; center?: boolean }) {
  return (
    <div className={cn("flex max-w-2xl flex-col gap-3", center && "mx-auto items-center text-center")}>
      <p className={pf.eyebrow}>{eyebrow}</p>
      <Tag id={id} className={pf.h2}>
        {children}
      </Tag>
      {text && <p className={cn("text-16 leading-relaxed text-pretty sm:text-18", pf.muted)}>{text}</p>}
    </div>
  );
}

// A montra do freelancer: o estilo do painel (claro, verde sálvia, dourado em detalhes) e os
// textos e dados do editor do Portfólio. Cada secção sem conteúdo não aparece.
export function PortfolioView({ portfolio, preview = false }: { portfolio: PublicPortfolio; preview?: boolean }) {
  const { display_name: name, headline, about, city, whatsapp, email, services, slug } = portfolio;
  const works = portfolio.works ?? [];
  const testimonials = portfolio.testimonials ?? [];
  const steps: readonly PortfolioStep[] = portfolio.process_steps?.length ? portfolio.process_steps : ptPT.portfolio.defaultSteps;
  const Heading = preview ? "h3" : "h1";
  const Title = preview ? "h4" : "h2";
  const Sub = preview ? "h5" : "h3";
  const reveal = preview ? "" : "pf-reveal";
  const whatsappHref = whatsapp ? whatsappUrl(copy.whatsappMessage, whatsapp) : null;
  const anchor = (id: string) => `${slug}-${id}`;
  const imageOf = (path: string | null) => (path && SUPABASE_URL ? publicImageUrl(path, SUPABASE_URL) : null);
  const firstName = name.split(/\s+/)[0] || name;
  const hasContact = Boolean(whatsappHref || email);

  const links = [
    { href: `#${anchor("demonstracao")}`, label: show.nav.demo },
    services.length > 0 && { href: `#${anchor("servicos")}`, label: show.nav.services },
    works.length > 0 && { href: `#${anchor("trabalhos")}`, label: show.nav.work },
    { href: `#${anchor("como-trabalho")}`, label: show.nav.process },
    hasContact && { href: `#${anchor("monta")}`, label: show.nav.build },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <div data-testid="portfolio-view" className={cn(pf.page, "antialiased [color-scheme:light]", preview ? "overflow-hidden rounded-lg" : whatsappHref ? "min-h-dvh pb-[calc(5.5rem+var(--badge-space))] sm:pb-[var(--badge-space)]" : "min-h-dvh pb-[var(--badge-space)]")}>
      <PublicNav name={name} initials={initialsOf(name)} links={links} contactHref={hasContact ? `#${anchor("contacto")}` : null} sticky={!preview} />

      {/* ================= Destaque ================= */}
      <header className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 -right-40 -z-10 size-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(100,123,99,0.16),transparent)]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-32 -z-10 size-[480px] rounded-full bg-[radial-gradient(closest-side,rgba(197,164,109,0.16),transparent)]" />
        <div className={cn(pf.container, "flex flex-col gap-8 pt-16 pb-20 sm:pt-24 sm:pb-28")}>
          {city && (
            <p className="inline-flex items-center gap-2 self-start rounded-full border border-[#EAEAE5] bg-white px-3.5 py-1.5 text-13 font-medium">
              <MapPin aria-hidden="true" size={14} className={pf.accentText} />
              {city}
            </p>
          )}
          <Heading className="max-w-4xl text-44 leading-[1.02] font-semibold tracking-[-0.04em] text-balance sm:text-64">
            {headline || name}
          </Heading>
          {headline && <p className={cn("text-18 sm:text-20", pf.muted)}>{name}</p>}
          <span aria-hidden="true" className="h-px w-24 bg-[#C5A46D]" />
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {whatsappHref && (
              <a id={anchor("wa-topo")} href={whatsappHref} target="_blank" rel="noreferrer noopener" className={cn(pf.primary, pf.focus)} data-testid="hero-whatsapp">
                <MessageCircle aria-hidden="true" size={18} />
                {copy.whatsapp}
              </a>
            )}
            {hasContact && (
              <a href={`#${anchor("monta")}`} className={cn(pf.secondary, pf.focus)} data-testid="hero-build">
                <ClipboardList aria-hidden="true" size={18} />
                {show.heroBuild}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ================= Demonstração de marcações ================= */}
      <section id={anchor("demonstracao")} aria-labelledby={`${anchor("demonstracao")}-t`} className={cn(pf.section, "border-t", pf.border, "bg-white")} data-testid="pf-section-demo">
        <div className={cn(pf.container, "grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center")}>
          <Head id={`${anchor("demonstracao")}-t`} eyebrow={show.demo.eyebrow} as={Title} text={show.demo.text}>
            {show.demo.title}
          </Head>
          <BookingDemo />
        </div>
      </section>

      {/* ================= Tecnologias ================= */}
      <section aria-labelledby={`${anchor("tecnologias")}-t`} className={cn("border-t py-12", pf.border)} data-testid="pf-section-tech">
        <div className={cn(pf.container, "flex flex-col items-center gap-5 text-center")}>
          <p className={pf.eyebrow}>{show.tech.eyebrow}</p>
          <Sub id={`${anchor("tecnologias")}-t`} className="text-18 font-semibold">
            {show.tech.title}
          </Sub>
          <ul className="flex flex-wrap justify-center gap-2.5">
            {TECHNOLOGIES.map((item) => (
              <li key={item} className="rounded-full border border-[#EAEAE5] bg-white px-4 py-2 text-14 font-medium shadow-[0_1px_2px_rgba(32,33,31,0.04)]">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ================= Serviços ================= */}
      {services.length > 0 && (
        <section id={anchor("servicos")} aria-labelledby={`${anchor("servicos")}-t`} className={cn(pf.section, "border-t", pf.border)} data-testid="pf-section-servicos">
          <div className={cn(pf.container, "flex flex-col gap-12")}>
            <Head id={`${anchor("servicos")}-t`} eyebrow={copy.services} as={Title}>
              {show.titles.services}
            </Head>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => {
                const Icon = serviceIcon(service.title);
                return (
                  <li key={service.title} className={cn(reveal, pf.card, "group flex flex-col gap-4 p-7 transition-[border-color,transform] duration-300 hover:border-[#647B63]/50 motion-safe:hover:-translate-y-1")}>
                    <span aria-hidden="true" className="inline-flex size-12 items-center justify-center rounded-xl bg-[#647B63]/10 text-[#4E6350] transition-colors group-hover:bg-[#647B63] group-hover:text-white">
                      <Icon size={22} strokeWidth={1.8} />
                    </span>
                    <Sub className="text-20 font-semibold tracking-[-0.01em]">{service.title}</Sub>
                    {service.description && <p className={cn("text-15 leading-relaxed", pf.muted)}>{service.description}</p>}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ================= Vê o teu negócio com um site ================= */}
      <section aria-labelledby={`${anchor("preview")}-t`} className={cn(pf.section, "border-t bg-white", pf.border)} data-testid="pf-section-preview">
        <div className={cn(pf.container, "flex flex-col gap-12")}>
          <Head id={`${anchor("preview")}-t`} eyebrow={show.preview.eyebrow} as={Title} text={show.preview.text}>
            {show.preview.title}
          </Head>
          <SitePreview />
        </div>
      </section>

      {/* ================= Trabalhos ================= */}
      {works.length > 0 && (
        <section id={anchor("trabalhos")} aria-labelledby={`${anchor("trabalhos")}-t`} className={cn(pf.section, "border-t", pf.border)} data-testid="pf-section-trabalhos">
          <div className={cn(pf.container, "flex flex-col gap-12")}>
            <Head id={`${anchor("trabalhos")}-t`} eyebrow={copy.work} as={Title}>
              {show.titles.work}
            </Head>
            <ul className="grid gap-6 lg:grid-cols-2">
              {works.map((work, index) => {
                const image = imageOf(work.image);
                const host = hostOf(work.url);
                return (
                  <li key={work.id} data-testid="pf-work" className={cn(reveal, pf.card, "flex flex-col overflow-hidden")}>
                    {image && (
                      <div className="border-b border-[#EAEAE5] bg-[#F3F3EF] p-3">
                        <div className="overflow-hidden rounded-xl border border-[#EAEAE5] bg-white">
                          <div className="flex h-8 items-center gap-2 border-b border-[#EAEAE5] px-3">
                            <span aria-hidden="true" className="flex gap-1.5">
                              {[0, 1, 2].map((dot) => (
                                <span key={dot} className="size-2 rounded-full bg-[#D8D8D1]" />
                              ))}
                            </span>
                            {host && (
                              <span className={cn("mx-auto flex min-w-0 items-center gap-1 text-12", pf.muted)} aria-label={copy.browserLabel(host)}>
                                <Lock aria-hidden="true" size={10} />
                                <span className="truncate">{host}</span>
                              </span>
                            )}
                          </div>
                          <div className="relative aspect-[16/10]">
                            <Image src={image} alt={copy.imageAlt(work.company_name)} fill sizes="(min-width: 1024px) 560px, 92vw" className="object-cover object-top" priority={!preview && index === 0} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-3 p-6 sm:p-7">
                      <p className={cn("flex items-center gap-2 text-12 font-semibold tracking-[0.12em] uppercase", pf.accentText)}>
                        <span>{two(index + 1)}</span>
                        <span aria-hidden="true" className="h-px w-5 bg-[#C5A46D]" />
                        {KINDS[work.kind]}
                      </p>
                      <Sub className="text-24 font-semibold tracking-[-0.02em]">{work.company_name}</Sub>
                      {work.summary && <p className={cn("text-15 leading-relaxed", pf.muted)}>{work.summary}</p>}
                      {work.url && (
                        <a
                          href={work.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={copy.visitLabel(work.company_name)}
                          className={cn("group mt-auto inline-flex items-center gap-2 self-start pt-2 text-15 font-semibold", pf.accentText, pf.focus)}
                        >
                          {copy.visitSite}
                          <ArrowUpRight aria-hidden="true" size={17} className="transition-transform duration-300 motion-safe:group-hover:rotate-45" />
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ================= Como trabalho ================= */}
      <section id={anchor("como-trabalho")} aria-labelledby={`${anchor("como-trabalho")}-t`} className={cn(pf.section, "border-t bg-white", pf.border)} data-testid="pf-section-como-trabalho">
        <div className={cn(pf.container, "flex flex-col gap-12")}>
          <Head id={`${anchor("como-trabalho")}-t`} eyebrow={copy.process} as={Title}>
            {show.titles.process}
          </Head>
          <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <span aria-hidden="true" className="absolute top-5 right-0 left-0 hidden h-px bg-[#EAEAE5] lg:block" />
            {steps.map((step, index) => (
              <li key={`${index}-${step.title}`} className={cn(reveal, "relative flex flex-col gap-3")}>
                <span aria-hidden="true" className="relative inline-flex size-10 items-center justify-center rounded-full border border-[#C5A46D] bg-white text-14 font-semibold tabular-nums">
                  {two(index + 1)}
                </span>
                <Sub className="text-18 font-semibold">{step.title}</Sub>
                <p className={cn("text-15 leading-relaxed", pf.muted)}>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= Os três valores ================= */}
      <section aria-labelledby={`${anchor("valores")}-t`} className={cn(pf.section, "border-t", pf.border)} data-testid="pf-values">
        <div className={cn(pf.container, "flex flex-col gap-12")}>
          <Head id={`${anchor("valores")}-t`} eyebrow={copy.values} as={Title}>
            {show.titles.values}
          </Head>
          <ul className="grid gap-5 md:grid-cols-3">
            {(
              [
                ["1×", values.build, values.buildText],
                ["↗", values.thirdParty, values.thirdPartyText],
                ["/mês", values.maintenance, values.maintenanceText],
              ] as const
            ).map(([glyph, term, text]) => (
              <li key={term} className={cn(reveal, pf.card, "flex flex-col gap-4 p-7")}>
                <span aria-hidden="true" className="text-32 leading-none font-semibold text-[#8A6A2F]">
                  {glyph}
                </span>
                <Sub className="text-20 font-semibold">{term}</Sub>
                <p className={cn("text-15 leading-relaxed", pf.muted)}>{text}</p>
              </li>
            ))}
          </ul>
          {portfolio.price_from && (
            <p data-testid="pf-price-from" className="inline-flex items-center gap-2 self-start rounded-full border border-[#C5A46D]/50 bg-white px-5 py-2.5 text-16 font-semibold">
              <span aria-hidden="true" className="size-2 rounded-full bg-[#C5A46D]" />
              {values.priceFromLabel(portfolio.price_from)}
            </p>
          )}
        </div>
      </section>

      {/* ================= Monta o teu projeto ================= */}
      {hasContact && (
        <section id={anchor("monta")} aria-labelledby={`${anchor("monta")}-t`} className={cn(pf.section, "border-t bg-white", pf.border)} data-testid="pf-section-build">
          <div className={cn(pf.container, "flex flex-col gap-12")}>
            <Head id={`${anchor("monta")}-t`} eyebrow={show.builder.eyebrow} as={Title} text={show.builder.text}>
              {show.builder.title}
            </Head>
            <ProjectBuilder owner={firstName} whatsapp={whatsapp} email={email} />
          </div>
        </section>
      )}

      {/* ================= Opiniões ================= */}
      {testimonials.length > 0 && (
        <section aria-labelledby={`${anchor("opinioes")}-t`} className={cn(pf.section, "border-t", pf.border)} data-testid="pf-section-opinioes">
          <div className={cn(pf.container, "flex flex-col gap-12")}>
            <Head id={`${anchor("opinioes")}-t`} eyebrow={copy.testimonials} as={Title}>
              {copy.testimonials}
            </Head>
            <ul className={cn("grid gap-5", testimonials.length > 1 && "md:grid-cols-2")}>
              {testimonials.map((item) => (
                <li key={`${item.first_name}-${item.quote.slice(0, 20)}`} className={cn(reveal, pf.card, "p-8 sm:p-10")}>
                  <figure className="flex flex-col gap-6">
                    <blockquote className={cn("leading-snug font-medium tracking-[-0.01em] text-pretty", testimonials.length === 1 ? "text-24" : "text-20")}>
                      <span aria-hidden="true" className="text-[#8A6A2F]">“</span>
                      {item.quote}
                      <span aria-hidden="true" className="text-[#8A6A2F]">”</span>
                    </blockquote>
                    <figcaption className={cn("text-15", pf.muted)}>
                      <span className="font-semibold text-[#20211F]">{item.first_name}</span> · {item.company}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ================= Sobre ================= */}
      {about && (
        <section aria-labelledby={`${anchor("sobre")}-t`} className={cn(pf.section, "border-t", pf.border)} data-testid="pf-section-sobre">
          <div className={cn(pf.container, "grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16")}>
            <div className="flex flex-col gap-6">
              <Head id={`${anchor("sobre")}-t`} eyebrow={copy.about} as={Title}>
                {name}
              </Head>
              <span aria-hidden="true" className="inline-flex size-24 items-center justify-center rounded-3xl bg-[#20211F] text-32 font-semibold text-white">
                {initialsOf(name)}
              </span>
            </div>
            <p className={cn("text-18 leading-[1.7] whitespace-pre-line text-pretty sm:text-20 lg:pt-10", pf.muted)}>{about}</p>
          </div>
        </section>
      )}

      {/* ================= Contacto ================= */}
      {hasContact && (
        <section id={anchor("contacto")} aria-labelledby={`${anchor("contacto")}-t`} className="scroll-mt-20 px-3 pb-3 sm:px-5 sm:pb-5" data-testid="pf-section-contacto">
          <div className="relative isolate overflow-hidden rounded-[32px] bg-[#20211F] px-6 py-20 text-white sm:px-12 sm:py-24">
            <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(100,123,99,0.45),transparent)]" />
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
              <p className="text-12 font-semibold tracking-[0.14em] text-[#E8D3A8] uppercase">{show.nav.contact}</p>
              <Title id={`${anchor("contacto")}-t`} className="text-32 leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-48">
                {copy.ctaTitle}
              </Title>
              <p className="text-18 text-white/75">{copy.ctaText}</p>
              <div className="mt-2 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
                {whatsappHref && (
                  <a id={anchor("wa-contacto")} href={whatsappHref} target="_blank" rel="noreferrer noopener" className={cn(pf.primary, "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white")}>
                    <MessageCircle aria-hidden="true" size={18} />
                    {copy.whatsapp}
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 text-15 font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    <Mail aria-hidden="true" size={18} />
                    {email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================= Rodapé ================= */}
      <footer className="overflow-hidden">
        <div className={cn(pf.container, "flex flex-col items-center justify-between gap-2 py-8 text-14 sm:flex-row", pf.muted)}>
          <span className="font-semibold text-[#20211F]">{name}</span>
          {city && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden="true" size={14} />
              {city}
            </span>
          )}
          <a href="#" className={cn("inline-flex items-center gap-1.5 rounded-sm", pf.focus)}>
            <ArrowDown aria-hidden="true" size={14} className="rotate-180" />
            {show.backToTop}
          </a>
        </div>
        {/* O nome enorme, só com contorno, cortado em baixo; fica verde ao passar o rato. */}
        <p
          aria-hidden="true"
          className="pf-outline-name -mb-[0.24em] text-center text-[22vw] leading-none font-bold tracking-[-0.06em] whitespace-nowrap select-none"
          data-testid="pf-footer-name"
          data-name={firstName}
        />
      </footer>
      {!preview && whatsappHref && <WhatsAppBar href={whatsappHref} watchIds={[anchor("wa-topo"), anchor("wa-contacto")]} />}
    </div>
  );
}
