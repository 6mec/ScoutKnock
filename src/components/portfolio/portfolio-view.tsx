import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  CalendarCheck,
  Globe,
  Hammer,
  LayoutGrid,
  Lock,
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
import type { CSSProperties, ReactNode } from "react";
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

// Paleta fixa da montra: preto da marca, verde do ScoutKnock como única cor de destaque
// (mais escuro no claro, mais vivo no escuro, para dar contraste AA nos dois).
const INK = "#0b0f14";
const GREEN = "#0a7f5b";
const muted = "text-[#566273]";
const focusDark = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const focusLight = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a7f5b]";
const container = "mx-auto w-full max-w-6xl px-5 sm:px-8";

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

function SectionTitle({ id, as: Tag, children, dark = false }: { id: string; as: "h2" | "h4"; children: ReactNode; dark?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <span aria-hidden="true" className={cn("h-1 w-10 rounded-full", dark ? "bg-[#2de2a6]" : "bg-[#0a7f5b]")} />
      <Tag id={id} className="text-32 leading-[1.1] font-bold tracking-[-0.02em] text-balance sm:text-44">
        {children}
      </Tag>
    </div>
  );
}

// A página pública do freelancer. É a montra dele: só mostra o que ele escreveu, e cada
// secção sem conteúdo não aparece.
export function PortfolioView({ portfolio, preview = false }: { portfolio: PublicPortfolio; preview?: boolean }) {
  const { display_name: name, headline, about, city, whatsapp, email, services, slug } = portfolio;
  const works = portfolio.works ?? [];
  const testimonials = portfolio.testimonials ?? [];
  const steps: readonly PortfolioStep[] = portfolio.process_steps?.length ? portfolio.process_steps : ptPT.portfolio.defaultSteps;
  const Heading = preview ? "h3" : "h1";
  const Title = preview ? "h4" : "h2";
  const Sub = preview ? "h5" : "h3";
  // Na pré-visualização do editor não há animações, navegação fixa nem barra do WhatsApp.
  const reveal = preview ? "" : "pf-reveal";
  // Junta a animação de entrada às classes do elemento (sem as substituir).
  const rise = (i: number, className?: string) =>
    preview ? { className } : { className: cn(className, "pf-rise"), style: { "--pf-i": i } as CSSProperties };
  const whatsappHref = whatsapp ? whatsappUrl(copy.whatsappMessage, whatsapp) : null;
  const heroId = `${slug}-topo`;
  const contactId = `${slug}-contacto`;
  const anchor = (id: string) => `${slug}-${id}`;
  const nav = [
    services.length > 0 && { id: "servicos", label: copy.services },
    works.length > 0 && { id: "trabalhos", label: copy.work },
    { id: "como-trabalho", label: copy.process },
  ].filter(Boolean) as { id: string; label: string }[];

  const whatsappButton = (variant: "green" | "white", size: "lg" | "sm" = "lg") =>
    whatsappHref && (
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(
          "group inline-flex items-center justify-center gap-2.5 rounded-xl font-semibold transition-[background-color,transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5",
          size === "lg" ? "min-h-14 px-7 text-16" : "min-h-10 px-4 text-14",
          variant === "green"
            ? "bg-[#0a7f5b] text-white shadow-[0_10px_30px_-10px_rgba(45,226,166,0.55)] hover:bg-[#0c8f67]"
            : "bg-white text-[#06513a] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] hover:bg-[#f0fbf6]",
          focusDark,
        )}
      >
        <MessageCircle aria-hidden="true" size={size === "lg" ? 20 : 16} strokeWidth={2} />
        {copy.whatsapp}
        {size === "lg" && <ArrowRight aria-hidden="true" size={18} strokeWidth={2} className="transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" />}
      </a>
    );
  const emailButton = email && (
    <a
      href={`mailto:${email}`}
      className={cn(
        "inline-flex min-h-14 items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-white/5 px-7 text-16 font-medium text-white backdrop-blur transition-colors duration-200 hover:border-white/45 hover:bg-white/10",
        focusDark,
      )}
    >
      <Mail aria-hidden="true" size={20} strokeWidth={1.9} />
      {copy.email}
    </a>
  );

  return (
    <div
      data-testid="portfolio-view"
      className={cn("bg-white text-[#0b0f14]", preview ? "overflow-hidden rounded-lg" : "min-h-dvh", !preview && whatsappHref && "pb-24 sm:pb-0")}
    >
      {/* ---------- Topo escuro: quem é, o que faz e a ação principal. ---------- */}
      <header id={heroId} className="relative isolate overflow-hidden text-white" style={{ background: INK }}>
        <div aria-hidden="true" className="pf-grid pointer-events-none absolute inset-0 -z-10" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-40 -z-10 size-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(45,226,166,0.28),transparent)] blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-56 -left-40 -z-10 size-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(10,127,91,0.35),transparent)] blur-2xl"
        />

        {/* Navegação: no computador fica presa no topo ao descer. */}
        <div className={cn("z-20 border-b border-white/10", !preview && "lg:sticky lg:top-0 lg:bg-[#0b0f14]/80 lg:backdrop-blur-md")}>
          <div className={cn(container, "flex h-16 items-center justify-between gap-4")}>
            <span className="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2de2a6] to-[#0a7f5b] text-13 font-bold text-[#0b0f14]">
                {initialsOf(name)}
              </span>
              <span className="truncate text-15 font-semibold">{name}</span>
            </span>
            <nav aria-label={copy.navLabel} className="hidden items-center gap-1 lg:flex">
              {nav.map((item) => (
                <a key={item.id} href={`#${anchor(item.id)}`} className={cn("rounded-lg px-3 py-2 text-14 text-white/75 transition-colors hover:text-white", focusDark)}>
                  {item.label}
                </a>
              ))}
              <a href={`#${contactId}`} className={cn("rounded-lg px-3 py-2 text-14 text-white/75 transition-colors hover:text-white", focusDark)}>
                {copy.navContact}
              </a>
              <span className="ml-3">{whatsappButton("green", "sm")}</span>
            </nav>
          </div>
        </div>

        <div className={cn(container, "grid items-center gap-12 pt-14 pb-20 sm:pt-20 sm:pb-28 lg:grid-cols-[1.25fr_1fr] lg:gap-16 lg:pt-24 lg:pb-32")}>
          <div className="flex flex-col gap-7">
            {city && (
              <p {...rise(0)}>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-13 font-medium text-white/80">
                  <MapPin aria-hidden="true" size={14} strokeWidth={2} className="text-[#2de2a6]" />
                  {city}
                </span>
              </p>
            )}
            <div {...rise(1, "flex flex-col gap-5")}>
              <Heading className="text-44 leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-64">{name}</Heading>
              {headline && <p className="max-w-xl text-18 leading-relaxed text-pretty text-white/75 sm:text-24 sm:leading-snug">{headline}</p>}
            </div>
            {(whatsappHref || email) && (
              <div {...rise(2, "flex flex-col gap-3 sm:flex-row sm:flex-wrap")}>
                {whatsappButton("green")}
                {emailButton}
              </div>
            )}
            {/* No telemóvel, os serviços em etiquetas pequenas (no computador vão em cartões ao lado). */}
            {services.length > 0 && (
              <ul aria-hidden="true" {...rise(3, "flex flex-wrap gap-2 lg:hidden")}>
                {services.map((service) => {
                  const Icon = serviceIcon(service.title);
                  return (
                    <li key={service.title} className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] py-1.5 pr-3.5 pl-2 text-13 font-medium text-white/85">
                      <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#2de2a6] text-[#0b0f14]">
                        <Icon size={13} strokeWidth={2.2} />
                      </span>
                      {service.title}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Os serviços em cartões de vidro, só no computador (são texto dele, nada inventado). */}
          {services.length > 0 && (
            <ul aria-hidden="true" {...rise(3, "relative hidden lg:flex lg:flex-col lg:gap-4")}>
              {services.slice(0, 3).map((service, index) => {
                const Icon = serviceIcon(service.title);
                return (
                  <li
                    key={service.title}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.8)] backdrop-blur-md"
                    style={{ marginLeft: `${index * 28}px` }}
                  >
                    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2de2a6] to-[#0a7f5b] text-[#0b0f14]">
                      <Icon size={22} strokeWidth={2} />
                    </span>
                    <span className="text-18 font-semibold text-white">{service.title}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </header>

      {/* ---------- Serviços ---------- */}
      {services.length > 0 && (
        <section aria-labelledby={anchor("servicos")} data-testid="pf-section-servicos" className="scroll-mt-16 bg-white py-20 sm:py-28">
          <div className={cn(container, "flex flex-col gap-12")}>
            <SectionTitle id={anchor("servicos")} as={Title}>
              {copy.services}
            </SectionTitle>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => {
                const Icon = serviceIcon(service.title);
                return (
                  <li
                    key={service.title}
                    className={cn(
                      reveal,
                      "group relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-[#e3e8ee] bg-[#f7f9fb] p-7 transition-[border-color,transform,box-shadow,background-color] duration-300 hover:border-[#0a7f5b]/35 hover:bg-white hover:shadow-[0_24px_48px_-24px_rgba(11,15,20,0.25)] motion-safe:hover:-translate-y-1 sm:p-8",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span aria-hidden="true" className="inline-flex size-14 items-center justify-center rounded-2xl bg-[#0b0f14] text-[#2de2a6] transition-colors duration-300 group-hover:bg-[#0a7f5b] group-hover:text-white">
                        <Icon size={26} strokeWidth={1.8} />
                      </span>
                      <span aria-hidden="true" className="font-mono text-14 font-semibold text-[#3d4754]">
                        {two(index + 1)}
                      </span>
                    </div>
                    <Sub className="text-24 leading-tight font-bold tracking-[-0.01em]">{service.title}</Sub>
                    {service.description && <p className={cn("text-16 leading-relaxed", muted)}>{service.description}</p>}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ---------- Trabalhos ---------- */}
      {works.length > 0 && (
        <section aria-labelledby={anchor("trabalhos")} data-testid="pf-section-trabalhos" className="scroll-mt-16 bg-[#f3f6f8] py-20 sm:py-28">
          <div className={cn(container, "flex flex-col gap-12")}>
            <SectionTitle id={anchor("trabalhos")} as={Title}>
              {copy.work}
            </SectionTitle>
            <ul className="flex flex-col gap-10">
              {works.map((work, index) => {
                const image = work.image && SUPABASE_URL ? publicImageUrl(work.image, SUPABASE_URL) : null;
                const host = hostOf(work.url);
                const flip = index % 2 === 1;
                return (
                  <li
                    key={work.id}
                    data-testid="pf-work"
                    className={cn(
                      reveal,
                      "grid items-center gap-8 overflow-hidden rounded-[28px] border border-[#e3e8ee] bg-white p-4 shadow-[0_30px_60px_-35px_rgba(11,15,20,0.3)] sm:p-6",
                      image ? "lg:grid-cols-[1.35fr_1fr] lg:gap-12 lg:p-8" : "border-l-4 border-l-[#0a7f5b] p-7 sm:p-10",
                    )}
                  >
                    {image && (
                      // Moldura de browser, com o endereço real do site quando existe.
                      <div className={cn("overflow-hidden rounded-2xl border border-[#d9e0e7] bg-white shadow-[0_24px_50px_-28px_rgba(11,15,20,0.45)]", flip && "lg:order-2")}>
                        <div className="flex h-10 items-center gap-3 border-b border-[#e3e8ee] bg-[#f3f6f8] px-4">
                          <span aria-hidden="true" className="flex gap-1.5">
                            <span className="size-2.5 rounded-full bg-[#d1d8e0]" />
                            <span className="size-2.5 rounded-full bg-[#d1d8e0]" />
                            <span className="size-2.5 rounded-full bg-[#d1d8e0]" />
                          </span>
                          {host && (
                            <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-3 py-1 text-12 text-[#566273]" aria-label={copy.browserLabel(host)}>
                              <Lock aria-hidden="true" size={11} strokeWidth={2.2} className="shrink-0" />
                              <span className="truncate">{host}</span>
                            </span>
                          )}
                        </div>
                        <div className="relative aspect-[16/10] bg-[#eef1f5]">
                          <Image
                            src={image}
                            alt={copy.imageAlt(work.company_name)}
                            fill
                            sizes="(min-width: 1024px) 620px, 100vw"
                            className="object-cover object-top"
                            priority={!preview && index === 0}
                          />
                        </div>
                      </div>
                    )}
                    <div className={cn("flex flex-col items-start gap-4", image && "px-2 pb-3 lg:px-0 lg:pb-0")}>
                      <span className="rounded-full bg-[#e6f4ef] px-3.5 py-1.5 text-13 font-semibold text-[#06513a]">{KINDS[work.kind]}</span>
                      <Sub className="text-32 leading-[1.1] font-bold tracking-[-0.02em]">{work.company_name}</Sub>
                      {work.summary && <p className={cn("text-18 leading-relaxed", muted)}>{work.summary}</p>}
                      {work.url && (
                        <a
                          href={work.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={copy.visitLabel(work.company_name)}
                          className={cn(
                            "group mt-2 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#0b0f14] px-6 text-15 font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-[#0a7f5b] motion-safe:hover:-translate-y-0.5",
                            focusLight,
                          )}
                        >
                          {copy.visitSite}
                          <ArrowUpRight aria-hidden="true" size={18} strokeWidth={2} className="transition-transform duration-200 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" />
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

      {/* ---------- Como trabalho: banda escura, números grandes. ---------- */}
      <section
        aria-labelledby={anchor("como-trabalho")}
        data-testid="pf-section-como-trabalho"
        className="relative isolate scroll-mt-16 overflow-hidden py-20 text-white sm:py-28"
        style={{ background: INK }}
      >
        <div aria-hidden="true" className="pf-grid pointer-events-none absolute inset-0 -z-10 opacity-60" />
        <div className={cn(container, "flex flex-col gap-14")}>
          <SectionTitle id={anchor("como-trabalho")} as={Title} dark>
            {copy.process}
          </SectionTitle>
          <ol className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            <span aria-hidden="true" className="absolute top-7 right-0 left-0 hidden h-px bg-gradient-to-r from-[#2de2a6]/60 via-white/15 to-transparent lg:block" />
            {steps.map((step, index) => (
              <li key={`${index}-${step.title}`} className={cn(reveal, "relative flex flex-col gap-4")}>
                <span
                  aria-hidden="true"
                  className="relative inline-flex size-14 items-center justify-center rounded-2xl border border-[#2de2a6]/40 bg-[#0b0f14] font-mono text-20 font-semibold text-[#2de2a6]"
                >
                  {two(index + 1)}
                </span>
                <Sub className="text-20 font-bold">{step.title}</Sub>
                <p className="text-16 leading-relaxed text-white/70">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Os três valores ---------- */}
      <section aria-labelledby={anchor("valores")} data-testid="pf-values" className="bg-white py-20 sm:py-28">
        <div className={cn(container, "flex flex-col gap-12")}>
          <SectionTitle id={anchor("valores")} as={Title}>
            {copy.values}
          </SectionTitle>
          <dl className="grid gap-5 md:grid-cols-3">
            {(
              [
                [Hammer, values.build, values.buildText],
                [Globe, values.thirdParty, values.thirdPartyText],
                [RefreshCw, values.maintenance, values.maintenanceText],
              ] as const
            ).map(([Icon, term, text]) => (
              <div key={term} className={cn(reveal, "relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-[#e3e8ee] bg-white p-7 sm:p-8")}>
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0a7f5b] to-[#2de2a6]" />
                <span aria-hidden="true" className="inline-flex size-12 items-center justify-center rounded-xl bg-[#e6f4ef] text-[#0a7f5b]">
                  <Icon size={22} strokeWidth={1.9} />
                </span>
                <dt className="text-20 font-bold">{term}</dt>
                <dd className={cn("text-16 leading-relaxed", muted)}>{text}</dd>
              </div>
            ))}
          </dl>
          {portfolio.price_from && (
            <p className="self-start rounded-2xl bg-[#0b0f14] px-6 py-4 text-18 font-semibold text-white" data-testid="pf-price-from">
              {values.priceFromLabel(portfolio.price_from)}
            </p>
          )}
        </div>
      </section>

      {/* ---------- Opiniões (só se houver autorizadas) ---------- */}
      {testimonials.length > 0 && (
        <section aria-labelledby={anchor("opinioes")} data-testid="pf-section-opinioes" className="bg-[#f3f6f8] py-20 sm:py-28">
          <div className={cn(container, "flex flex-col gap-12")}>
            <SectionTitle id={anchor("opinioes")} as={Title}>
              {copy.testimonials}
            </SectionTitle>
            <ul className="grid gap-5 md:grid-cols-2">
              {testimonials.map((item) => (
                <li key={`${item.first_name}-${item.quote.slice(0, 20)}`} className={cn(reveal, "relative overflow-hidden rounded-3xl border border-[#e3e8ee] bg-white p-8 sm:p-10")}>
                  <span aria-hidden="true" className="pointer-events-none absolute -top-6 right-6 font-serif text-[160px] leading-none text-[#0a7f5b]/12 select-none">
                    ”
                  </span>
                  <figure className="relative flex flex-col gap-6">
                    <blockquote className="text-20 leading-relaxed font-medium">“{item.quote}”</blockquote>
                    <figcaption className="flex items-center gap-3">
                      <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-full bg-[#e6f4ef] text-14 font-bold text-[#06513a]">
                        {item.first_name[0]?.toUpperCase()}
                      </span>
                      <span className="text-15 font-semibold">{copy.testimonialBy(item.first_name, item.company)}</span>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---------- Sobre ---------- */}
      {about && (
        <section aria-labelledby={anchor("sobre")} data-testid="pf-section-sobre" className="bg-white pb-20 sm:pb-28">
          <div className={cn(container, "grid gap-10 border-t border-[#e3e8ee] pt-20 sm:pt-28 lg:grid-cols-[auto_1fr] lg:gap-16")}>
            <span
              aria-hidden="true"
              className="inline-flex size-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#2de2a6] to-[#0a7f5b] text-32 font-bold text-[#0b0f14] shadow-[0_20px_40px_-20px_rgba(10,127,91,0.7)] sm:size-32 sm:text-44"
            >
              {initialsOf(name)}
            </span>
            <div className="flex flex-col gap-6">
              <SectionTitle id={anchor("sobre")} as={Title}>
                {copy.about}
              </SectionTitle>
              <p className="max-w-3xl text-18 leading-[1.7] whitespace-pre-line text-[#2a333e] sm:text-20">{about}</p>
            </div>
          </div>
        </section>
      )}

      {/* ---------- Fecho: chamada para falar, banda verde. ---------- */}
      {(whatsappHref || email) && (
        <section aria-labelledby={contactId} data-testid="pf-section-contacto" className="scroll-mt-16 bg-white px-3 pb-3 sm:px-5 sm:pb-5">
          <div
            id={`${contactId}-zona`}
            className="relative isolate overflow-hidden rounded-[32px] px-6 py-16 text-white sm:px-12 sm:py-24"
            style={{ background: `linear-gradient(135deg, ${GREEN} 0%, #06513a 100%)` }}
          >
            <div aria-hidden="true" className="pf-grid pointer-events-none absolute inset-0 -z-10 opacity-70" />
            <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-24 -z-10 size-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(45,226,166,0.45),transparent)] blur-2xl" />
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
              <Title id={contactId} className="text-32 leading-[1.08] font-bold tracking-[-0.03em] text-balance sm:text-64">
                {copy.ctaTitle}
              </Title>
              <p className="text-18 text-white/90 sm:text-20">{copy.ctaText}</p>
              <div className="mt-2 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
                {whatsappButton("white")}
                {emailButton}
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="bg-white">
        <div className={cn(container, "flex flex-col items-center justify-between gap-2 py-8 text-14 sm:flex-row", muted)}>
          <span className="font-semibold text-[#0b0f14]">{name}</span>
          {city && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden="true" size={14} strokeWidth={2} />
              {city}
            </span>
          )}
        </div>
      </footer>

      {!preview && whatsappHref && <WhatsAppBar href={whatsappHref} heroId={heroId} contactId={`${contactId}-zona`} />}
    </div>
  );
}
