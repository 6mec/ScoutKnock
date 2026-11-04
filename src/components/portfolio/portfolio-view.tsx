import { ArrowUpRight, Mail, MapPin, MessageCircle } from "lucide-react";
import { ptPT } from "@/i18n/pt-PT";
import { whatsappUrl } from "@/lib/messages/rules";
import type { PublicPortfolio } from "@/lib/portfolio/rules";
import { cn } from "@/lib/utils";

const copy = ptPT.portfolio.page;

// A página pública do freelancer. Paleta clara fixa: é a montra dele, não a app.
export function PortfolioView({
  portfolio,
  preview = false,
}: {
  portfolio: PublicPortfolio;
  preview?: boolean;
}) {
  const { display_name: name, headline, about, city, whatsapp, email, services, projects, sites } =
    portfolio;
  const work = [
    ...projects.map((project) => ({ ...project, key: `p-${project.title}` })),
    ...sites.map((site) => ({
      key: `s-${site.name}`,
      title: site.company_name,
      description: null as string | null,
      url: `/s/${site.name}`,
    })),
  ];
  const Heading = preview ? "h3" : "h1";
  const Section = preview ? "h4" : "h2";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

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
    <div
      data-testid="portfolio-view"
      className={cn("bg-[#f7f9fb] text-[#0b0f14]", preview ? "rounded-lg" : "min-h-dvh")}
    >
      <header className="relative overflow-hidden border-b border-[#e3e8ee] bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_100%_0%,rgba(10,127,91,0.10),transparent_60%)]"
        />
        <div className="relative mx-auto flex max-w-4xl flex-col gap-6 px-6 py-14 sm:py-20">
          <span
            aria-hidden="true"
            className="inline-flex size-16 items-center justify-center rounded-2xl bg-[#0b0f14] text-20 font-bold text-white"
          >
            {initials}
          </span>
          <div className="flex flex-col gap-3">
            <Heading className="text-32 leading-tight font-bold tracking-tight sm:text-44">{name}</Heading>
            {headline && <p className="max-w-2xl text-18 leading-relaxed text-[#3d4754]">{headline}</p>}
            {city && (
              <p className="inline-flex items-center gap-1.5 text-14 text-[#566273]">
                <MapPin aria-hidden="true" size={16} strokeWidth={1.9} />
                {city}
              </p>
            )}
          </div>
          {contactButtons}
        </div>
      </header>

      <div className="mx-auto flex max-w-4xl flex-col gap-14 px-6 py-14">
        {about && <p className="max-w-2xl text-16 leading-relaxed whitespace-pre-line text-[#3d4754]">{about}</p>}

        {services.length > 0 && (
          <section aria-labelledby={`${portfolio.slug}-services`} className="flex flex-col gap-5">
            <Section id={`${portfolio.slug}-services`} className="text-24 font-bold tracking-tight">
              {copy.services}
            </Section>
            <ul className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <li
                  key={service.title}
                  className="rounded-xl border border-[#e3e8ee] bg-white p-5 shadow-[0_1px_2px_rgba(11,15,20,0.04)]"
                >
                  <p className="font-semibold">{service.title}</p>
                  {service.description && (
                    <p className="mt-1 text-14 leading-relaxed text-[#566273]">{service.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {work.length > 0 && (
          <section aria-labelledby={`${portfolio.slug}-work`} className="flex flex-col gap-5">
            <Section id={`${portfolio.slug}-work`} className="text-24 font-bold tracking-tight">
              {copy.projects}
            </Section>
            <ul className="grid gap-3 sm:grid-cols-2">
              {work.map((item) => (
                <li
                  key={item.key}
                  className="flex flex-col gap-2 rounded-xl border border-[#e3e8ee] bg-white p-5 shadow-[0_1px_2px_rgba(11,15,20,0.04)]"
                >
                  <p className="font-semibold">{item.title}</p>
                  {item.description && (
                    <p className="text-14 leading-relaxed text-[#566273]">{item.description}</p>
                  )}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={copy.visitLabel(item.title)}
                      className="mt-auto inline-flex min-h-11 items-center gap-1 self-start text-14 font-semibold text-[#0a7f5b] underline-offset-4 hover:underline"
                    >
                      {copy.visit}
                      <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.9} />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {!about && services.length === 0 && work.length === 0 && (
          <p className="text-[#566273]">{copy.empty}</p>
        )}

        {contactButtons && (
          <section
            aria-labelledby={`${portfolio.slug}-contact`}
            className="flex flex-col gap-4 rounded-2xl bg-[#0b0f14] p-8 text-white"
          >
            <Section id={`${portfolio.slug}-contact`} className="text-24 font-bold tracking-tight">
              {copy.contact}
            </Section>
            <div className="[&_a]:border-white/20">{contactButtons}</div>
          </section>
        )}
      </div>
    </div>
  );
}
