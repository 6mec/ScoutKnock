import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  CalendarCheck,
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
import type { CSSProperties, ReactNode } from "react";
import { ptPT } from "@/i18n/pt-PT";
import { whatsappUrl } from "@/lib/messages/rules";
import { publicImageUrl } from "@/lib/portfolio/images";
import type { PortfolioStep, PublicPortfolio } from "@/lib/portfolio/rules";
import { cn } from "@/lib/utils";
import { Spotlight } from "./spotlight";
import { WhatsAppBar } from "./whatsapp-bar";

const copy = ptPT.portfolio.page;
const values = ptPT.portfolio.values;
const KINDS = ptPT.projects.kinds;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Paleta fixa da montra: preto da marca e o verde do ScoutKnock como única cor de destaque
// (#0a7f5b no claro, #2de2a6 no escuro, para contraste AA nos dois).
const INK = "#0b0f14";
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

// Título de secção com o número em letra de código.
function SectionTitle({ id, n, as: Tag, children, dark = false }: { id: string; n: number; as: "h2" | "h4"; children: ReactNode; dark?: boolean }) {
  return (
    <div className="flex items-baseline gap-4">
      <span aria-hidden="true" className={cn("font-mono text-14 font-semibold", dark ? "text-[#2de2a6]" : "text-[#0a7f5b]")}>
        {two(n)}
      </span>
      <Tag id={id} className="text-32 leading-[1.05] font-bold tracking-[-0.03em] text-balance sm:text-44 lg:text-64">
        {children}
      </Tag>
    </div>
  );
}

// Moldura de browser escura (topo) ou clara (trabalhos), com o endereço real do site.
function BrowserFrame({
  image,
  host,
  alt,
  dark,
  sizes,
  priority,
}: {
  image: string;
  host: string | null;
  alt: string;
  dark: boolean;
  sizes: string;
  priority: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border",
        dark ? "border-white/10 bg-[#11161d] shadow-[0_50px_100px_-40px_rgba(0,0,0,0.9)]" : "border-[#d9e0e7] bg-white shadow-[0_30px_60px_-30px_rgba(11,15,20,0.45)]",
      )}
    >
      <div className={cn("flex h-9 items-center gap-3 border-b px-3.5", dark ? "border-white/10 bg-white/[0.03]" : "border-[#e3e8ee] bg-[#f3f6f8]")}>
        <span aria-hidden="true" className="flex gap-1.5">
          {[0, 1, 2].map((dot) => (
            <span key={dot} className={cn("size-2.5 rounded-full", dark ? "bg-white/15" : "bg-[#d1d8e0]")} />
          ))}
        </span>
        {host && (
          <span
            className={cn("flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-0.5 text-12", dark ? "bg-white/[0.06] text-white/70" : "bg-white text-[#566273]")}
            aria-label={copy.browserLabel(host)}
          >
            <Lock aria-hidden="true" size={11} strokeWidth={2.2} className="shrink-0" />
            <span className="truncate">{host}</span>
          </span>
        )}
      </div>
      <div className={cn("relative aspect-[16/10]", dark ? "bg-[#1a2028]" : "bg-[#eef1f5]")}>
        <Image src={image} alt={alt} fill sizes={sizes} className="object-cover object-top" priority={priority} />
      </div>
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
  const motion = (name: string) => (preview ? "" : name);
  const rise = (i: number, className?: string) =>
    preview ? { className } : { className: cn(className, "pf-rise"), style: { "--pf-i": i } as CSSProperties };
  const whatsappHref = whatsapp ? whatsappUrl(copy.whatsappMessage, whatsapp) : null;
  const heroId = `${slug}-topo`;
  const contactId = `${slug}-contacto`;
  const anchor = (id: string) => `${slug}-${id}`;
  const imageOf = (path: string | null) => (path && SUPABASE_URL ? publicImageUrl(path, SUPABASE_URL) : null);
  // O trabalho com captura vai para o topo, num ecrã de computador e num telemóvel.
  const featured = works.find((work) => work.image);
  const featuredImage = featured ? imageOf(featured.image) : null;

  // Numeração das secções que existem.
  const order = [
    services.length > 0 && "servicos",
    works.length > 0 && "trabalhos",
    "como-trabalho",
    "valores",
    testimonials.length > 0 && "opinioes",
    about && "sobre",
  ].filter(Boolean) as string[];
  const n = (id: string) => order.indexOf(id) + 1;
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
          "group inline-flex items-center justify-center gap-2.5 rounded-full font-semibold transition-[background-color,transform,box-shadow] duration-300 motion-safe:hover:-translate-y-0.5",
          size === "lg" ? "min-h-14 px-8 text-16" : "min-h-10 px-4 text-14",
          variant === "green"
            ? "bg-[#0a7f5b] text-white shadow-[0_0_0_1px_rgba(45,226,166,0.35),0_14px_40px_-10px_rgba(45,226,166,0.6)] hover:bg-[#0c8f67] hover:shadow-[0_0_0_1px_rgba(45,226,166,0.6),0_18px_50px_-10px_rgba(45,226,166,0.75)]"
            : "bg-white text-[#06513a] shadow-[0_14px_40px_-12px_rgba(0,0,0,0.6)] hover:bg-[#f0fbf6]",
          focusDark,
        )}
      >
        <MessageCircle aria-hidden="true" size={size === "lg" ? 20 : 16} strokeWidth={2} />
        {copy.whatsapp}
        {size === "lg" && (
          <ArrowRight aria-hidden="true" size={18} strokeWidth={2} className="transition-transform duration-300 motion-safe:group-hover:translate-x-1" />
        )}
      </a>
    );
  const emailButton = email && (
    <a
      href={`mailto:${email}`}
      className={cn(
        "inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full border border-white/20 bg-white/[0.04] px-8 text-16 font-medium text-white backdrop-blur transition-colors duration-300 hover:border-white/50 hover:bg-white/10",
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
      className={cn("bg-white text-[#0b0f14] antialiased", preview ? "overflow-hidden rounded-lg" : "min-h-dvh", !preview && whatsappHref && "pb-24 sm:pb-0")}
    >
      {/* ================= Topo ================= */}
      <header id={heroId} className="pf-grain relative isolate overflow-hidden text-white" style={{ background: INK }}>
        <div aria-hidden="true" className="pf-grid pointer-events-none absolute inset-0 -z-10" />
        <div
          aria-hidden="true"
          className={cn("pointer-events-none absolute -top-48 -right-32 -z-10 size-[640px] rounded-full bg-[radial-gradient(closest-side,rgba(45,226,166,0.32),transparent)] blur-3xl", motion("pf-drift"))}
        />
        <div
          aria-hidden="true"
          className={cn("pointer-events-none absolute -bottom-64 -left-40 -z-10 size-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(10,127,91,0.45),transparent)] blur-3xl", motion("pf-drift-slow"))}
        />

        <div className={cn("relative z-20 border-b border-white/10", !preview && "lg:sticky lg:top-0 lg:bg-[#0b0f14]/75 lg:backdrop-blur-xl")}>
          <div className={cn(container, "flex h-16 items-center justify-between gap-4")}>
            <span className="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2de2a6] to-[#0a7f5b] text-13 font-bold text-[#0b0f14]">
                {initialsOf(name)}
              </span>
              <span className="truncate text-15 font-semibold tracking-tight">{name}</span>
            </span>
            <nav aria-label={copy.navLabel} className="hidden items-center gap-1 lg:flex">
              {nav.map((item) => (
                <a key={item.id} href={`#${anchor(item.id)}`} className={cn("rounded-full px-3.5 py-2 text-14 text-white/70 transition-colors hover:bg-white/5 hover:text-white", focusDark)}>
                  {item.label}
                </a>
              ))}
              <a href={`#${contactId}`} className={cn("rounded-full px-3.5 py-2 text-14 text-white/70 transition-colors hover:bg-white/5 hover:text-white", focusDark)}>
                {copy.navContact}
              </a>
              <span className="ml-3">{whatsappButton("green", "sm")}</span>
            </nav>
          </div>
        </div>

        <div className={cn(container, "relative z-10 grid items-center gap-14 pt-14 pb-20 sm:pt-20 sm:pb-28 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pt-24 lg:pb-32")}>
          <div className="flex flex-col gap-7">
            {city && (
              <p {...rise(0)}>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] py-1.5 pr-4 pl-1.5 text-13 font-medium text-white/80 backdrop-blur">
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#2de2a6]/15">
                    <MapPin aria-hidden="true" size={13} strokeWidth={2.2} className="text-[#2de2a6]" />
                  </span>
                  {city}
                </span>
              </p>
            )}
            <div {...rise(1, "flex flex-col gap-5")}>
              <Heading className="text-44 leading-[0.98] font-bold tracking-[-0.045em] sm:text-64 xl:text-84">{name}</Heading>
              {headline && <p className="max-w-xl text-18 leading-relaxed text-pretty text-white/72 sm:text-24 sm:leading-snug">{headline}</p>}
            </div>
            {(whatsappHref || email) && (
              <div {...rise(2, "flex flex-col gap-3 sm:flex-row sm:flex-wrap")}>
                {whatsappButton("green")}
                {emailButton}
              </div>
            )}
            {services.length > 0 && (
              <ul aria-hidden="true" {...rise(3, "flex flex-wrap gap-2")}>
                {services.map((service) => {
                  const Icon = serviceIcon(service.title);
                  return (
                    <li key={service.title} className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] py-1.5 pr-3.5 pl-1.5 text-13 font-medium text-white/85">
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

          {/* O trabalho em destaque num computador e num telemóvel. */}
          {featured && featuredImage && (
            <div {...rise(3, "relative mx-auto w-full max-w-[560px] pr-6 pb-12 sm:pr-12 lg:mx-0 lg:max-w-none")}>
              <div aria-hidden="true" className="pointer-events-none absolute inset-8 -z-10 rounded-full bg-[#2de2a6]/25 blur-3xl" />
              <div className={motion("pf-float")}>
                <BrowserFrame
                  image={featuredImage}
                  host={hostOf(featured.url)}
                  alt={copy.imageAlt(featured.company_name)}
                  dark
                  sizes="(min-width: 1024px) 540px, 92vw"
                  priority={!preview}
                />
              </div>
              <div aria-hidden="true" className={cn("absolute right-0 bottom-0 w-[30%] min-w-[104px]", motion("pf-float-late"))}>
                <div className="overflow-hidden rounded-[22px] border-[5px] border-[#232a33] bg-black shadow-[0_40px_80px_-25px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.08)] sm:rounded-[28px] sm:border-[6px]">
                  <div className="relative aspect-[9/19]">
                    <Image src={featuredImage} alt="" fill sizes="180px" className="object-cover object-center" />
                    <span className="absolute top-1.5 left-1/2 h-1.5 w-1/3 -translate-x-1/2 rounded-full bg-[#232a33]" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ================= Serviços ================= */}
      {services.length > 0 && (
        <section aria-labelledby={anchor("servicos")} data-testid="pf-section-servicos" className="scroll-mt-16 bg-white py-24 sm:py-32">
          <div className={cn(container, "flex flex-col gap-14")}>
            <SectionTitle id={anchor("servicos")} n={n("servicos")} as={Title}>
              {copy.services}
            </SectionTitle>
            <Spotlight className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => {
                const Icon = serviceIcon(service.title);
                return (
                  <li
                    key={service.title}
                    className={cn(
                      reveal,
                      "pf-spot group flex flex-col gap-6 overflow-hidden rounded-[28px] border border-[#e3e8ee] bg-[#f7f9fb] p-7 transition-[border-color,transform,box-shadow,background-color] duration-300 hover:border-[#0a7f5b]/30 hover:bg-white hover:shadow-[0_30px_60px_-30px_rgba(11,15,20,0.3)] motion-safe:hover:-translate-y-1 sm:p-9",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span aria-hidden="true" className="inline-flex size-14 items-center justify-center rounded-2xl bg-[#0b0f14] text-[#2de2a6] transition-[background-color,color,transform] duration-300 group-hover:bg-[#0a7f5b] group-hover:text-white motion-safe:group-hover:rotate-[-6deg]">
                        <Icon size={26} strokeWidth={1.8} />
                      </span>
                      <span aria-hidden="true" className="font-mono text-14 font-semibold text-[#3d4754]">
                        {two(index + 1)}
                      </span>
                    </div>
                    <Sub className="text-24 leading-tight font-bold tracking-[-0.02em]">{service.title}</Sub>
                    {service.description && <p className={cn("text-16 leading-relaxed", muted)}>{service.description}</p>}
                  </li>
                );
              })}
            </Spotlight>
          </div>
        </section>
      )}

      {/* ================= Trabalhos ================= */}
      {works.length > 0 && (
        <section aria-labelledby={anchor("trabalhos")} data-testid="pf-section-trabalhos" className="scroll-mt-16 bg-[#f3f6f8] py-24 sm:py-32">
          <div className={cn(container, "flex flex-col gap-14")}>
            <SectionTitle id={anchor("trabalhos")} n={n("trabalhos")} as={Title}>
              {copy.work}
            </SectionTitle>
            <ul className="flex flex-col gap-10">
              {works.map((work, index) => {
                const image = imageOf(work.image);
                const flip = index % 2 === 1;
                return (
                  <li key={work.id} data-testid="pf-work" className={cn(reveal, "rounded-[32px]", index === 0 && motion("pf-ring"))}>
                    <div
                      className={cn(
                        "grid items-center gap-8 rounded-[30.5px] bg-white p-4 shadow-[0_40px_80px_-45px_rgba(11,15,20,0.35)] sm:p-6",
                        index !== 0 && "border border-[#e3e8ee]",
                        image ? "lg:grid-cols-[1.35fr_1fr] lg:gap-14 lg:p-10" : "p-7 sm:p-12",
                      )}
                    >
                      {image && (
                        <div className={cn(flip && "lg:order-2")}>
                          <BrowserFrame
                            image={image}
                            host={hostOf(work.url)}
                            alt={copy.imageAlt(work.company_name)}
                            dark={false}
                            sizes="(min-width: 1024px) 620px, 100vw"
                            priority={false}
                          />
                        </div>
                      )}
                      <div className={cn("flex flex-col items-start gap-5", image && "px-2 pb-3 lg:px-0 lg:pb-0")}>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#e6f4ef] px-3.5 py-1.5 text-13 font-semibold text-[#06513a]">
                          <span aria-hidden="true" className="size-1.5 rounded-full bg-[#0a7f5b]" />
                          {KINDS[work.kind]}
                        </span>
                        <Sub className="text-32 leading-[1.05] font-bold tracking-[-0.03em] sm:text-44">{work.company_name}</Sub>
                        {work.summary && <p className={cn("text-18 leading-relaxed", muted)}>{work.summary}</p>}
                        {work.url && (
                          <a
                            href={work.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={copy.visitLabel(work.company_name)}
                            className={cn(
                              "group mt-1 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#0b0f14] pr-2 pl-6 text-15 font-semibold text-white transition-[background-color,transform] duration-300 hover:bg-[#0a7f5b] motion-safe:hover:-translate-y-0.5",
                              focusLight,
                            )}
                          >
                            {copy.visitSite}
                            <span className="inline-flex size-9 items-center justify-center rounded-full bg-white/10 transition-transform duration-300 motion-safe:group-hover:rotate-45">
                              <ArrowUpRight aria-hidden="true" size={18} strokeWidth={2} />
                            </span>
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ================= Como trabalho ================= */}
      <section
        aria-labelledby={anchor("como-trabalho")}
        data-testid="pf-section-como-trabalho"
        className="pf-grain relative isolate scroll-mt-16 overflow-hidden py-24 text-white sm:py-32"
        style={{ background: INK }}
      >
        <div aria-hidden="true" className="pf-grid pointer-events-none absolute inset-0 -z-10 opacity-50" />
        <div aria-hidden="true" className="pointer-events-none absolute top-1/3 -right-40 -z-10 size-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(10,127,91,0.4),transparent)] blur-3xl" />
        <div className={cn(container, "relative z-10 grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20")}>
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionTitle id={anchor("como-trabalho")} n={n("como-trabalho")} as={Title} dark>
              {copy.process}
            </SectionTitle>
          </div>
          <ol className="relative flex flex-col gap-12 pl-16 sm:gap-16">
            <span aria-hidden="true" className="absolute top-3 bottom-3 left-[23px] w-px bg-white/12" />
            <span aria-hidden="true" className={cn("absolute top-3 bottom-3 left-[23px] w-px bg-gradient-to-b from-[#2de2a6] to-[#0a7f5b]", motion("pf-fill"))} />
            {steps.map((step, index) => (
              <li key={`${index}-${step.title}`} className={cn(reveal, "relative flex flex-col gap-3")}>
                <span
                  aria-hidden="true"
                  className="absolute top-0 -left-16 inline-flex size-12 items-center justify-center rounded-full border border-[#2de2a6]/50 bg-[#0b0f14] font-mono text-15 font-semibold text-[#2de2a6] shadow-[0_0_0_6px_#0b0f14,0_0_30px_-4px_rgba(45,226,166,0.5)]"
                >
                  {two(index + 1)}
                </span>
                <Sub className="pt-2 text-24 font-bold tracking-[-0.02em]">{step.title}</Sub>
                <p className="max-w-lg text-18 leading-relaxed text-white/70">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= Os três valores ================= */}
      <section aria-labelledby={anchor("valores")} data-testid="pf-values" className="bg-white py-24 sm:py-32">
        <div className={cn(container, "flex flex-col gap-14")}>
          <SectionTitle id={anchor("valores")} n={n("valores")} as={Title}>
            {copy.values}
          </SectionTitle>
          <Spotlight className="grid gap-5 md:grid-cols-3">
            {(
              [
                ["1×", values.build, values.buildText],
                ["↗", values.thirdParty, values.thirdPartyText],
                ["/mês", values.maintenance, values.maintenanceText],
              ] as const
            ).map(([glyph, term, text]) => (
              <li key={term} className={cn(reveal, "pf-spot flex flex-col gap-5 overflow-hidden rounded-[28px] border border-[#e3e8ee] bg-white p-7 sm:p-9")}>
                <span aria-hidden="true" className="font-mono text-44 leading-none font-semibold tracking-tight text-[#0a7f5b]">
                  {glyph}
                </span>
                <Sub className="text-24 font-bold tracking-[-0.02em]">{term}</Sub>
                <p className={cn("text-16 leading-relaxed", muted)}>{text}</p>
              </li>
            ))}
          </Spotlight>
          {portfolio.price_from && (
            <p className="inline-flex items-center gap-3 self-start rounded-full bg-[#0b0f14] py-3 pr-6 pl-3 text-18 font-semibold text-white" data-testid="pf-price-from">
              <span aria-hidden="true" className="inline-flex size-8 items-center justify-center rounded-full bg-[#2de2a6] font-mono text-14 text-[#0b0f14]">
                €
              </span>
              {values.priceFromLabel(portfolio.price_from)}
            </p>
          )}
        </div>
      </section>

      {/* ================= Opiniões (só se houver autorizadas) ================= */}
      {testimonials.length > 0 && (
        <section aria-labelledby={anchor("opinioes")} data-testid="pf-section-opinioes" className="bg-[#f3f6f8] py-24 sm:py-32">
          <div className={cn(container, "flex flex-col gap-14")}>
            <SectionTitle id={anchor("opinioes")} n={n("opinioes")} as={Title}>
              {copy.testimonials}
            </SectionTitle>
            <Spotlight className="grid gap-5 md:grid-cols-2">
              {testimonials.map((item) => (
                <li key={`${item.first_name}-${item.quote.slice(0, 20)}`} className={cn(reveal, "pf-spot overflow-hidden rounded-[28px] border border-[#e3e8ee] bg-white p-8 sm:p-10")}>
                  <span aria-hidden="true" className="pointer-events-none absolute -top-8 right-6 font-serif text-[180px] leading-none text-[#0a7f5b]/10 select-none">
                    ”
                  </span>
                  <figure className="relative flex flex-col gap-6">
                    <blockquote className="text-20 leading-relaxed font-medium tracking-[-0.01em]">“{item.quote}”</blockquote>
                    <figcaption className="flex items-center gap-3">
                      <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[#2de2a6] to-[#0a7f5b] text-14 font-bold text-[#0b0f14]">
                        {item.first_name[0]?.toUpperCase()}
                      </span>
                      <span className="text-15 font-semibold">{copy.testimonialBy(item.first_name, item.company)}</span>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </Spotlight>
          </div>
        </section>
      )}

      {/* ================= Sobre ================= */}
      {about && (
        <section aria-labelledby={anchor("sobre")} data-testid="pf-section-sobre" className="bg-white pb-24 sm:pb-32">
          <div className={cn(container, "grid gap-12 border-t border-[#e3e8ee] pt-24 sm:pt-32 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20")}>
            <div className="flex flex-col gap-10">
              <SectionTitle id={anchor("sobre")} n={n("sobre")} as={Title}>
                {copy.about}
              </SectionTitle>
              <span
                aria-hidden="true"
                className="relative inline-flex size-28 items-center justify-center overflow-hidden rounded-[32px] bg-[#0b0f14] text-44 font-bold tracking-tight text-white shadow-[0_30px_60px_-30px_rgba(10,127,91,0.9)] sm:size-36 sm:text-64"
              >
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(45,226,166,0.55),transparent_60%)]" />
                <span className="relative">{initialsOf(name)}</span>
              </span>
            </div>
            <p className="text-20 leading-[1.65] tracking-[-0.01em] whitespace-pre-line text-[#2a333e] sm:text-24 sm:leading-[1.55] lg:pt-20">{about}</p>
          </div>
        </section>
      )}

      {/* ================= Fecho ================= */}
      {(whatsappHref || email) && (
        <section aria-labelledby={contactId} data-testid="pf-section-contacto" className="scroll-mt-16 bg-white px-3 pb-3 sm:px-5 sm:pb-5">
          <div id={`${contactId}-zona`} className="pf-grain relative isolate overflow-hidden rounded-[36px] px-6 py-20 text-white sm:px-12 sm:py-32" style={{ background: INK }}>
            <div aria-hidden="true" className="pf-grid pointer-events-none absolute inset-0 -z-10" />
            <div
              aria-hidden="true"
              className={cn("pointer-events-none absolute -bottom-72 left-1/2 -z-10 size-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(45,226,166,0.4),transparent)] blur-3xl", motion("pf-drift-slow"))}
            />
            <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-7 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 font-mono text-13 text-[#2de2a6]">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-[#2de2a6]" />
                {copy.navContact}
              </span>
              <Title id={contactId} className="text-44 leading-[1.0] font-bold tracking-[-0.045em] text-balance sm:text-64 lg:text-84">
                {copy.ctaTitle}
              </Title>
              <p className="text-18 text-white/75 sm:text-20">{copy.ctaText}</p>
              <div className="mt-3 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
                {whatsappButton("green")}
                {emailButton}
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="relative overflow-hidden" style={{ background: INK }}>
        <div className={cn(container, "relative z-10 flex flex-col items-center justify-between gap-2 py-8 text-14 text-white/70 sm:flex-row")}>
          <span className="font-semibold text-white">{name}</span>
          {city && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden="true" size={14} strokeWidth={2} />
              {city}
            </span>
          )}
        </div>
        <p aria-hidden="true" className="pf-outline -mb-[0.22em] overflow-hidden text-center text-[18vw] leading-none font-bold tracking-[-0.06em] whitespace-nowrap select-none">
          {name.split(/\s+/)[0]}
        </p>
      </footer>

      {!preview && whatsappHref && <WhatsAppBar href={whatsappHref} heroId={heroId} contactId={`${contactId}-zona`} />}
    </div>
  );
}
