import { ArrowUpRight, Mail, MapPin, MessageCircle } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { ptPT } from "@/i18n/pt-PT";
import { whatsappUrl } from "@/lib/messages/rules";
import { publicImageUrl } from "@/lib/portfolio/images";
import type { PortfolioStep, PublicPortfolio } from "@/lib/portfolio/rules";
import { cn } from "@/lib/utils";

const copy = ptPT.portfolio.page;
const values = ptPT.portfolio.values;
const KINDS = ptPT.projects.kinds;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const card = "rounded-xl border border-[#e3e8ee] bg-white shadow-[0_1px_2px_rgba(11,15,20,0.04)]";
const muted = "text-[#566273]";

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
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
    <section aria-labelledby={headingId} data-testid={`pf-section-${id}`} className={cn("flex flex-col gap-5", className)}>
      <Title id={headingId} className="text-24 font-bold tracking-tight">
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

  const contactButtons = (whatsapp || email) && (
    <div className="flex flex-wrap gap-3">
      {whatsapp && (
        <a
          href={whatsappUrl(copy.whatsappMessage, whatsapp)}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-[#0a7f5b] px-5 text-15 font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)] transition-colors hover:bg-[#086b4c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a7f5b]"
        >
          <MessageCircle aria-hidden="true" size={18} strokeWidth={1.9} />
          {copy.whatsapp}
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#cbd3dd] bg-white px-5 text-15 font-medium text-[#0b0f14] transition-colors hover:border-[#7c8796] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a7f5b]"
        >
          <Mail aria-hidden="true" size={18} strokeWidth={1.9} />
          {copy.email}
        </a>
      )}
    </div>
  );

  return (
    <div data-testid="portfolio-view" className={cn("bg-[#f7f9fb] text-[#0b0f14]", preview ? "rounded-lg" : "min-h-dvh")}>
      {/* Topo: quem é, o que faz e como falar com ele. */}
      <header className="relative overflow-hidden border-b border-[#e3e8ee] bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_100%_0%,rgba(10,127,91,0.10),transparent_60%)]"
        />
        <div className="relative mx-auto flex max-w-4xl flex-col gap-6 px-5 py-12 sm:px-6 sm:py-20">
          <span aria-hidden="true" className="inline-flex size-14 items-center justify-center rounded-2xl bg-[#0b0f14] text-18 font-bold text-white sm:size-16 sm:text-20">
            {initialsOf(name)}
          </span>
          <div className="flex flex-col gap-3">
            <Heading className="text-32 leading-tight font-bold tracking-tight sm:text-44">{name}</Heading>
            {headline && <p className="max-w-2xl text-18 leading-relaxed text-[#3d4754]">{headline}</p>}
            {city && (
              <p className={cn("inline-flex items-center gap-1.5 text-14", muted)}>
                <MapPin aria-hidden="true" size={16} strokeWidth={1.9} />
                {city}
              </p>
            )}
          </div>
          {contactButtons}
        </div>
      </header>

      <div className="mx-auto flex max-w-4xl flex-col gap-14 px-5 py-12 sm:px-6 sm:py-14">
        {services.length > 0 && (
          <Section slug={slug} as={Title} id="servicos" title={copy.services}>
            <ul className={cn(card, "divide-y divide-[#eef1f5]")}>
              {services.map((service) => (
                <li key={service.title} className="flex flex-col gap-0.5 px-5 py-4 sm:flex-row sm:items-baseline sm:gap-4">
                  <span className="font-semibold sm:w-56 sm:shrink-0">{service.title}</span>
                  {service.description && <span className={cn("text-15 leading-relaxed", muted)}>{service.description}</span>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {works.length > 0 && (
          <Section slug={slug} as={Title} id="trabalhos" title={copy.work}>
            <ul className="grid gap-4 sm:grid-cols-2">
              {works.map((work, index) => (
                <li key={work.id} className={cn(card, "flex flex-col overflow-hidden")} data-testid="pf-work">
                  <div className="relative aspect-[16/10] bg-[#eef1f5]">
                    {work.image && SUPABASE_URL ? (
                      <Image
                        src={publicImageUrl(work.image, SUPABASE_URL)}
                        alt={copy.imageAlt(work.company_name)}
                        fill
                        sizes="(min-width: 640px) 430px, 100vw"
                        className="object-cover object-top"
                        priority={!preview && index < 2}
                      />
                    ) : (
                      <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-32 font-bold text-[#5f6b7a]">
                        {initialsOf(work.company_name)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 p-5">
                    <p className="text-13 font-medium tracking-wide text-[#0a7f5b] uppercase">{KINDS[work.kind]}</p>
                    <p className="text-18 font-semibold">{work.company_name}</p>
                    {work.summary && <p className={cn("text-15 leading-relaxed", muted)}>{work.summary}</p>}
                    {work.url && (
                      <a
                        href={work.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={copy.visitLabel(work.company_name)}
                        className="mt-auto inline-flex min-h-11 items-center gap-1 self-start pt-2 text-14 font-semibold text-[#0a7f5b] underline-offset-4 hover:underline"
                      >
                        {copy.visitSite}
                        <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.9} />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section slug={slug} as={Title} id="como-trabalho" title={copy.process}>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={`${index}-${step.title}`} className={cn(card, "flex flex-col gap-2 p-5")}>
                <span aria-hidden="true" className="inline-flex size-8 items-center justify-center rounded-full bg-[#e6f4ef] text-14 font-bold text-[#0a7f5b]">
                  {index + 1}
                </span>
                <p className="font-semibold">{step.title}</p>
                <p className={cn("text-14 leading-relaxed", muted)}>{step.text}</p>
              </li>
            ))}
          </ol>
          <div className={cn(card, "flex flex-col gap-4 p-5")}>
            <Sub className="text-16 font-semibold">{copy.values}</Sub>
            <dl className="grid gap-4 sm:grid-cols-3">
              {[
                [values.build, values.buildText],
                [values.thirdParty, values.thirdPartyText],
                [values.maintenance, values.maintenanceText],
              ].map(([term, text]) => (
                <div key={term} className="flex flex-col gap-1">
                  <dt className="font-semibold">{term}</dt>
                  <dd className={cn("text-14 leading-relaxed", muted)}>{text}</dd>
                </div>
              ))}
            </dl>
            {portfolio.price_from && (
              <p className="text-15 font-semibold" data-testid="pf-price-from">
                {values.priceFromLabel(portfolio.price_from)}
              </p>
            )}
          </div>
        </Section>

        {testimonials.length > 0 && (
          <Section slug={slug} as={Title} id="opinioes" title={copy.testimonials}>
            <ul className="grid gap-4 sm:grid-cols-2">
              {testimonials.map((item) => (
                <li key={`${item.first_name}-${item.quote.slice(0, 20)}`} className={cn(card, "p-5")}>
                  <figure className="flex flex-col gap-3">
                    <blockquote className="text-16 leading-relaxed">“{item.quote}”</blockquote>
                    <figcaption className={cn("text-14 font-medium", muted)}>{copy.testimonialBy(item.first_name, item.company)}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {about && (
          <Section slug={slug} as={Title} id="sobre" title={copy.about}>
            <p className="max-w-2xl text-16 leading-relaxed whitespace-pre-line text-[#3d4754]">{about}</p>
          </Section>
        )}

        {contactButtons && (
          <section
            aria-labelledby={`${slug}-contacto`}
            data-testid="pf-section-contacto"
            className="flex flex-col gap-4 rounded-2xl bg-[#0b0f14] p-6 text-white sm:p-8"
          >
            <Title id={`${slug}-contacto`} className="text-24 font-bold tracking-tight">
              {copy.contact}
            </Title>
            {city && (
              <p className="inline-flex items-center gap-1.5 text-14 text-white/75">
                <MapPin aria-hidden="true" size={16} strokeWidth={1.9} />
                {city}
              </p>
            )}
            <div className="[&_a]:border-white/20">{contactButtons}</div>
          </section>
        )}
      </div>
    </div>
  );
}
