import { MapPin, Phone } from "lucide-react";
import { ptPT } from "@/i18n/pt-PT";
import type { PublicDemo } from "@/lib/demos/rules";
import { cn } from "@/lib/utils";

const { demos: copy } = ptPT;

// Cores próprias e fixas: é o site da empresa, não a interface do ScoutKnock.
const SURFACES = {
  classic: "bg-[#FFFFFF] text-[#111827]",
  bold: "bg-[#FFFFFF] text-[#111827]",
  soft: "bg-[#FAF7F2] text-[#1F2937]",
};
const MUTED = "text-[#4B5563]";

// Usa consultas de contentor, para a prévia reagir à largura e não à do ecrã.
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
  const Title = preview ? "p" : "h1";
  const Section = preview ? "p" : "h2";
  // Na prévia não há ligação: a galeria já põe o cartão inteiro dentro de uma.
  const Call = preview ? "span" : "a";
  const isBold = demo.template === "bold";
  const accent = { color: demo.accent_color };

  return (
    <div className={cn("@container w-full flex-1", SURFACES[demo.template])}>
      {!official && (
        <p
          role="note"
          className="bg-[#FFB547] px-4 py-2.5 text-center text-14 font-semibold text-[#0B0F14]"
        >
          {copy.notice(demo.author_name, demo.company_name)}
        </p>
      )}
      <div
        style={isBold ? { backgroundColor: demo.accent_color } : undefined}
        className={cn(isBold && "text-[#FFFFFF]")}
      >
        <div className="mx-auto max-w-240 px-6 py-12 @3xl:py-20">
          <p
            style={isBold ? undefined : accent}
            className="text-14 font-semibold tracking-wide uppercase"
          >
            {demo.headline}
          </p>
          <Title
            className={cn(
              "mt-4 text-32 leading-tight font-bold tracking-tight @3xl:text-64",
              demo.template === "soft" && "font-semibold",
            )}
          >
            {demo.company_name}
          </Title>
          <p
            className={cn(
              "mt-6 max-w-160 text-18 leading-relaxed",
              !isBold && MUTED,
            )}
          >
            {demo.intro}
          </p>
          {demo.phone && (
            <Call
              // Só algarismos e +: o texto do freelancer nunca vira outro tipo de ligação.
              href={preview ? undefined : `tel:${demo.phone.replace(/[^\d+]/g, "")}`}
              style={
                isBold
                  ? { color: demo.accent_color }
                  : { backgroundColor: demo.accent_color }
              }
              className={cn(
                "mt-8 inline-flex min-h-12 items-center gap-2 rounded-md px-6 font-semibold",
                isBold ? "bg-[#FFFFFF]" : "text-[#FFFFFF]",
                demo.template === "soft" && "rounded-pill",
              )}
            >
              <Phone aria-hidden="true" size={18} strokeWidth={1.75} />
              {copy.view.call}
            </Call>
          )}
        </div>
      </div>
      <div className="mx-auto max-w-240 px-6 py-12">
        <Section className="text-24 font-bold tracking-tight">
          {copy.view.contact}
        </Section>
        <ul className="mt-6 grid gap-4 @2xl:grid-cols-2">
          <li
            className={cn(
              "flex gap-3 rounded-md border border-[#D1D5DB] p-5",
              demo.template === "soft" && "rounded-lg bg-[#FFFFFF]",
            )}
          >
            <MapPin
              aria-hidden="true"
              size={20}
              strokeWidth={1.75}
              style={accent}
              className="mt-0.5 shrink-0"
            />
            <span>
              <span className={cn("block text-14", MUTED)}>{copy.view.address}</span>
              {demo.address}
            </span>
          </li>
          {demo.phone && (
            <li
              className={cn(
                "flex gap-3 rounded-md border border-[#D1D5DB] p-5",
                demo.template === "soft" && "rounded-lg bg-[#FFFFFF]",
              )}
            >
              <Phone
                aria-hidden="true"
                size={20}
                strokeWidth={1.75}
                style={accent}
                className="mt-0.5 shrink-0"
              />
              <span>
                <span className={cn("block text-14", MUTED)}>{copy.view.phone}</span>
                {demo.phone}
              </span>
            </li>
          )}
        </ul>
      </div>
      {official && !preview && removalContact && (
        <footer className="mx-auto max-w-240 px-6 pb-8">
          <a
            href={`mailto:${removalContact}?subject=${encodeURIComponent(copy.official.removalSubject(demo.company_name))}`}
            className={cn("inline-flex min-h-11 items-center text-14 underline", MUTED)}
          >
            {copy.official.removal}
          </a>
        </footer>
      )}
    </div>
  );
}
