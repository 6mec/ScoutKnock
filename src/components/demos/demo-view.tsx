import { ArrowRight, Check, MapPin, MessageCircle, Phone } from "lucide-react";
import type { CSSProperties } from "react";
import { ptPT } from "@/i18n/pt-PT";
import { DEMO_FONT_VARIABLES, FONT_FAMILIES } from "@/lib/demos/fonts";
import { heroButton, identityOf, textOn } from "@/lib/demos/identities";
import type { PublicDemo } from "@/lib/demos/rules";
import { whatsappNumber, whatsappUrl } from "@/lib/messages/rules";
import { cn } from "@/lib/utils";
import { BookingSection } from "./booking-section";

const { demos: copy } = ptPT;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((word) => word.length > 2 || /^[A-ZÀ-Ú]/.test(word))
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

// O site da empresa, com as cores e as letras da identidade do nicho. Usa consultas
// de contentor, para a prévia reagir à largura dela e não à do ecrã.
export function DemoView({
  demo,
  preview = false,
  official = false,
  removalContact,
}: {
  demo: PublicDemo;
  preview?: boolean;
  // Só um site oficial perde o aviso de proposta não oficial.
  official?: boolean;
  removalContact?: string | null;
}) {
  const identity = identityOf(demo.niche_style, demo.niche);
  const p = identity.palette;
  const accent = demo.accent_color;
  const layout = demo.template;
  // As demos feitas antes do construtor não têm estes campos: usa o modelo do nicho.
  const services = demo.services?.length ? demo.services : identity.copy.services;
  const highlights = demo.highlights?.length ? demo.highlights : identity.copy.highlights;
  const subheadline = demo.subheadline || demo.intro;
  const cta = demo.cta_label || identity.copy.cta;
  const about = demo.about || identity.copy.about;
  const display: CSSProperties = { fontFamily: FONT_FAMILIES[identity.fonts.display] };
  const heroCta = heroButton(p, accent);
  const id = (name: string) => (preview ? undefined : name);

  const Title = preview ? "p" : "h1";
  const Section = preview ? "p" : "h2";
  const Item = preview ? "p" : "h3";
  // Na prévia não há ligações: a galeria já põe o cartão inteiro dentro de uma.
  const Link = preview ? "span" : "a";
  const phoneHref = demo.phone ? `tel:${demo.phone.replace(/[^\d+]/g, "")}` : undefined;
  const whatsapp = whatsappNumber(demo.phone)
    ? whatsappUrl(copy.view.whatsappMessage(demo.company_name), demo.phone)
    : null;
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${demo.address}, ${demo.locality}`)}`;
  const external = preview ? {} : { target: "_blank", rel: "noreferrer noopener" };
  const radius = layout === "soft" ? "rounded-[999px]" : layout === "bold" ? "rounded-[6px]" : "rounded-[10px]";
  const card = layout === "soft" ? "rounded-[20px]" : layout === "bold" ? "rounded-[8px]" : "rounded-[14px]";

  const primaryButton = (background: string, label: string, href?: string) => (
    <Link
      href={preview ? undefined : href}
      style={{ backgroundColor: background, color: textOn(background) }}
      className={cn(
        "inline-flex min-h-12 items-center gap-2 px-6 text-15 font-semibold shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)]",
        radius,
      )}
    >
      <Phone aria-hidden="true" size={18} strokeWidth={2} />
      {label}
    </Link>
  );

  return (
    <div
      data-testid="demo-view"
      className={cn("@container w-full flex-1", DEMO_FONT_VARIABLES)}
      style={{
        backgroundColor: p.background,
        color: p.text,
        fontFamily: FONT_FAMILIES[identity.fonts.body],
      }}
    >
      {!official && (
        <p
          role="note"
          className="bg-[#FFB547] px-4 py-2.5 text-center text-14 font-semibold text-[#0B0F14]"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          {copy.notice(demo.author_name, demo.company_name)}
        </p>
      )}

      {/* Topo do site */}
      <header
        style={{ backgroundColor: p.heroBackground, color: p.heroText, borderColor: `${p.heroMuted}33` }}
        className="border-b"
      >
        <div className="mx-auto flex max-w-260 items-center justify-between gap-4 px-6 py-4">
          <span className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              style={{ backgroundColor: accent, color: textOn(accent), ...display }}
              className={cn("inline-flex size-10 shrink-0 items-center justify-center text-15 font-bold", card)}
            >
              {initials(demo.company_name) || "·"}
            </span>
            <span style={display} className="truncate text-18 font-bold tracking-tight">
              {demo.company_name}
            </span>
          </span>
          <nav aria-label={preview ? undefined : copy.view.nav} className="hidden items-center gap-6 text-14 @3xl:flex">
            <Link href={preview ? undefined : "#servicos"} style={{ color: p.heroMuted }}>
              {copy.view.services}
            </Link>
            {demo.booking_enabled && (
              <Link href={preview ? undefined : "#marcar"} style={{ color: p.heroMuted }}>
                {copy.booking.nav}
              </Link>
            )}
            <Link href={preview ? undefined : "#sobre"} style={{ color: p.heroMuted }}>
              {copy.view.aboutNav}
            </Link>
            <Link href={preview ? undefined : "#contacto"} style={{ color: p.heroMuted }}>
              {copy.view.contact}
            </Link>
          </nav>
        </div>
      </header>

      {/* Herói */}
      <section
        style={{ backgroundColor: p.heroBackground, color: p.heroText }}
        className="relative overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              layout === "bold"
                ? `radial-gradient(60% 80% at 100% 0%, ${accent}40, transparent 60%), repeating-linear-gradient(135deg, ${p.heroText}08 0 1px, transparent 1px 14px)`
                : layout === "soft"
                  ? `radial-gradient(50% 70% at 90% 10%, ${accent}26, transparent 70%), radial-gradient(40% 60% at 0% 100%, ${accent}1a, transparent 70%)`
                  : `radial-gradient(70% 90% at 100% 0%, ${accent}1f, transparent 60%)`,
          }}
        />
        <div className="relative mx-auto grid max-w-260 gap-10 px-6 py-14 @3xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] @3xl:items-center @3xl:py-24">
          <div className="flex flex-col gap-6">
            <p
              style={{ color: layout === "bold" ? accent : p.heroMuted }}
              className="text-13 font-semibold tracking-[0.14em] uppercase"
            >
              {demo.niche} · {demo.locality}
            </p>
            <Title
              style={display}
              className={cn(
                "text-[clamp(2.25rem,6cqi,4.25rem)] leading-[1.02] font-bold tracking-tight text-balance",
                identity.fonts.display === "oswald" && "uppercase tracking-normal",
              )}
            >
              {demo.headline}
            </Title>
            <p style={{ color: p.heroMuted }} className="max-w-xl text-18 leading-relaxed text-pretty">
              {subheadline}
            </p>
            <div className="flex flex-wrap gap-3">
              {demo.phone && primaryButton(heroCta, cta, phoneHref)}
              <Link
                href={preview ? undefined : "#servicos"}
                style={{ borderColor: `${p.heroText}40`, color: p.heroText }}
                className={cn("inline-flex min-h-12 items-center gap-2 border px-6 text-15 font-medium", radius)}
              >
                {copy.view.seeServices}
                <ArrowRight aria-hidden="true" size={18} strokeWidth={2} />
              </Link>
            </div>
          </div>
          {/* Cartão decorativo com os primeiros serviços, como numa montra. */}
          <div
            aria-hidden="true"
            style={{ backgroundColor: p.surface, color: p.text, borderColor: p.border }}
            className={cn(
              "hidden flex-col gap-4 border p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)] @3xl:flex",
              card,
              layout === "soft" && "rotate-[1.5deg]",
            )}
          >
            <span style={{ ...display, color: accent }} className="text-44 leading-none font-bold">
              {initials(demo.company_name) || "·"}
            </span>
            <ul className="flex flex-col gap-3">
              {services.slice(0, 3).map((service) => (
                <li key={service.title} className="flex items-center gap-3 text-15">
                  <span
                    style={{ backgroundColor: `${accent}1f`, color: accent }}
                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full"
                  >
                    <Check size={15} strokeWidth={2.4} />
                  </span>
                  {service.title}
                </li>
              ))}
            </ul>
            <p style={{ color: p.muted }} className="flex items-center gap-2 text-13">
              <MapPin size={14} strokeWidth={2} />
              {demo.locality}
            </p>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id={id("servicos")} className="mx-auto max-w-260 px-6 py-16 @3xl:py-24">
        <Section style={display} className="text-32 leading-tight font-bold tracking-tight @3xl:text-44">
          {copy.view.services}
        </Section>
        <ul className="mt-8 grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
          {services.map((service, index) => (
            <li
              key={`${service.title}-${index}`}
              style={{ backgroundColor: p.surface, borderColor: p.border }}
              className={cn("flex flex-col gap-3 border p-6", card)}
            >
              <span
                aria-hidden="true"
                style={{ color: accent, ...display }}
                className="text-24 leading-none font-bold"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <Item className="text-18 font-semibold">{service.title}</Item>
              {service.description && (
                <p style={{ color: p.muted }} className="text-15 leading-relaxed">
                  {service.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {demo.booking_enabled && (
        <BookingSection
          companyName={demo.company_name}
          phone={demo.phone}
          services={services.map((service) => service.title)}
          hours={demo.booking_hours || null}
          official={official}
          preview={preview}
          theme={{
            background: p.background,
            surface: p.surface,
            text: p.text,
            muted: p.muted,
            border: p.border,
            accent,
            radius,
            card,
            display,
          }}
        />
      )}

      {/* Destaques */}
      <section
        style={{ backgroundColor: p.surface, borderColor: p.border }}
        className="border-y"
        aria-label={preview ? undefined : copy.view.why}
      >
        <ul className="mx-auto grid max-w-260 gap-6 px-6 py-12 @2xl:grid-cols-3">
          {highlights.map((item, index) => (
            <li key={`${item.title}-${index}`} className="flex gap-3">
              <span
                aria-hidden="true"
                style={{ backgroundColor: accent, color: textOn(accent) }}
                className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full"
              >
                <Check size={16} strokeWidth={2.4} />
              </span>
              <span>
                <span className="block font-semibold">{item.title}</span>
                {item.description && (
                  <span style={{ color: p.muted }} className="block text-15">
                    {item.description}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Sobre */}
      <section id={id("sobre")} className="mx-auto grid max-w-260 gap-6 px-6 py-16 @3xl:grid-cols-[0.9fr_1.1fr] @3xl:py-24">
        <Section style={display} className="text-32 leading-tight font-bold tracking-tight @3xl:text-44">
          {copy.view.about(demo.company_name)}
        </Section>
        <div style={{ color: p.muted }} className="flex flex-col gap-4 text-16 leading-relaxed">
          {demo.intro && demo.intro !== subheadline && <p>{demo.intro}</p>}
          <p>{about}</p>
        </div>
      </section>

      {/* Contacto */}
      <section
        id={id("contacto")}
        style={{ backgroundColor: p.heroBackground, color: p.heroText }}
      >
        <div className="mx-auto flex max-w-260 flex-col gap-8 px-6 py-16 @3xl:flex-row @3xl:items-end @3xl:justify-between">
          <div className="flex flex-col gap-3">
            <Section style={display} className="text-32 leading-tight font-bold tracking-tight @3xl:text-44">
              {copy.view.contact}
            </Section>
            <p style={{ color: p.heroMuted }} className="text-16">
              {copy.view.contactLead}
            </p>
            <p className="flex items-start gap-2 text-16">
              <MapPin aria-hidden="true" size={18} strokeWidth={2} className="mt-0.5 shrink-0" style={{ color: heroCta }} />
              <span>
                <span className="sr-only">{copy.view.address}: </span>
                {demo.address}
              </span>
            </p>
            {demo.phone && (
              <p className="flex items-center gap-2 text-16">
                <Phone aria-hidden="true" size={18} strokeWidth={2} style={{ color: heroCta }} />
                <span>
                  <span className="sr-only">{copy.view.phone}: </span>
                  {demo.phone}
                </span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {demo.phone && primaryButton(heroCta, copy.view.call, phoneHref)}
            {whatsapp && (
              <Link
                href={preview ? undefined : whatsapp}
                {...external}
                style={{ borderColor: `${p.heroText}40`, color: p.heroText }}
                className={cn("inline-flex min-h-12 items-center gap-2 border px-6 text-15 font-medium", radius)}
              >
                <MessageCircle aria-hidden="true" size={18} strokeWidth={2} />
                {copy.view.whatsapp}
                {!preview && <span className="sr-only">{copy.view.newTab}</span>}
              </Link>
            )}
            <Link
              href={preview ? undefined : mapHref}
              {...external}
              style={{ borderColor: `${p.heroText}40`, color: p.heroText }}
              className={cn("inline-flex min-h-12 items-center gap-2 border px-6 text-15 font-medium", radius)}
            >
              <MapPin aria-hidden="true" size={18} strokeWidth={2} />
              {copy.view.map}
              {!preview && <span className="sr-only">{copy.view.newTab}</span>}
            </Link>
          </div>
        </div>
      </section>

      <footer style={{ color: p.muted, borderColor: p.border }} className="border-t">
        <div className="mx-auto flex max-w-260 flex-wrap items-center justify-between gap-3 px-6 py-6 text-14">
          <span>
            {demo.company_name} · {demo.locality}
          </span>
          {official && !preview && removalContact && (
            <a
              href={`mailto:${removalContact}?subject=${encodeURIComponent(copy.official.removalSubject(demo.company_name))}`}
              className="inline-flex min-h-11 items-center underline"
            >
              {copy.official.removal}
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}
