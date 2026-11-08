"use client";

import { CalendarCheck, Info, Lock, MapPin, Phone, ShoppingBag, Stethoscope, UtensilsCrossed, Scissors, type LucideIcon } from "lucide-react";
import { useId, useState } from "react";
import { ptPT } from "@/i18n/pt-PT";
import { PREVIEW_COLORS, PREVIEW_KINDS, type PreviewColor, type PreviewKind } from "@/lib/portfolio/showcase";
import { cn } from "@/lib/utils";
import { pf } from "./styles";

const copy = ptPT.portfolio.showcase.preview;
const ICONS: Record<PreviewKind, LucideIcon> = { barbershop: Scissors, restaurant: UtensilsCrossed, clinic: Stethoscope, shop: ShoppingBag };

function slugHost(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
  return `${slug || "onegocio"}.pt`;
}

// O "site" desenhado com o nome, o tipo e a cor escolhidos. Só aparência: não há links.
function Mock({ name, kind, color, compact }: { name: string; kind: PreviewKind; color: string; compact: boolean }) {
  const template = copy.templates[kind];
  const Icon = ICONS[kind];
  return (
    <div className="flex h-full flex-col bg-white text-[#20211F]">
      <div className={cn("flex items-center justify-between border-b border-[#EAEAE5]", compact ? "px-3 py-2" : "px-5 py-3")}>
        <span className="flex min-w-0 items-center gap-2">
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-white" style={{ background: color }}>
            <Icon size={13} />
          </span>
          <span className={cn("truncate font-semibold", compact ? "text-12" : "text-14")}>{name}</span>
        </span>
        {!compact && (
          <span className="flex gap-4 text-12 text-[#6C6E67]">
            {copy.nav.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </span>
        )}
      </div>
      <div className={cn("flex flex-col gap-3", compact ? "p-3" : "p-6")} style={{ background: `linear-gradient(160deg, ${color}1f, transparent 70%)` }}>
        <span className={cn("font-semibold tracking-[-0.02em] break-words", compact ? "text-18 leading-tight" : "text-32 leading-[1.05]")}>{name}</span>
        <span className={cn("text-[#6C6E67]", compact ? "text-12" : "text-15")}>{template.tagline}</span>
        <span
          className={cn("inline-flex items-center gap-1.5 self-start rounded-full font-semibold text-white", compact ? "px-3 py-1.5 text-12" : "px-4 py-2 text-14")}
          style={{ background: color }}
        >
          <CalendarCheck size={compact ? 12 : 14} />
          {template.cta}
        </span>
      </div>
      <div className={cn("grid gap-2", compact ? "grid-cols-1 px-3 pb-3" : "grid-cols-3 px-6 pb-6")}>
        {template.items.map((item) => (
          <span key={item} className={cn("rounded-lg border border-[#EAEAE5] font-medium", compact ? "px-2.5 py-2 text-12" : "px-3 py-3 text-13")}>
            <span aria-hidden="true" className="mb-1 block h-1 w-6 rounded-full" style={{ background: color }} />
            {item}
          </span>
        ))}
      </div>
      <div className={cn("mt-auto flex items-center gap-3 border-t border-[#EAEAE5] text-[#6C6E67]", compact ? "px-3 py-2 text-[10px]" : "px-6 py-3 text-12")}>
        <MapPin size={compact ? 10 : 12} />
        <Phone size={compact ? 10 : 12} />
      </div>
    </div>
  );
}

// "Vê o teu negócio com um site": tudo no browser, nada é guardado nem enviado.
export function SitePreview() {
  const id = useId();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<PreviewKind>("barbershop");
  const [colorId, setColorId] = useState<PreviewColor>("sage");
  const color = PREVIEW_COLORS.find((item) => item.id === colorId)?.hex ?? PREVIEW_COLORS[0].hex;
  const shown = name.trim() || copy.defaultName;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start" data-testid="site-preview">
      <div className={cn(pf.card, "flex flex-col gap-5 p-5 sm:p-6")}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-nome`} className="text-14 font-semibold">
            {copy.name}
          </label>
          <input
            id={`${id}-nome`}
            value={name}
            maxLength={40}
            placeholder={copy.namePlaceholder}
            onChange={(event) => setName(event.target.value)}
            className={pf.input}
            data-testid="preview-name"
          />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-14 font-semibold">{copy.kind}</legend>
          <div className="grid grid-cols-2 gap-2">
            {PREVIEW_KINDS.map((item) => {
              const Icon = ICONS[item];
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={kind === item}
                  onClick={() => setKind(item)}
                  className={cn(pf.chip, "justify-start rounded-xl", kind === item ? pf.chipOn : pf.chipOff, pf.focus)}
                >
                  <Icon aria-hidden="true" size={16} />
                  {copy.kinds[item]}
                </button>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-14 font-semibold">{copy.color}</legend>
          <div className="flex flex-wrap gap-2.5">
            {PREVIEW_COLORS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={colorId === item.id}
                aria-label={copy.colors[item.id]}
                title={copy.colors[item.id]}
                onClick={() => setColorId(item.id)}
                className={cn(
                  "size-10 rounded-full border-2 transition-transform motion-safe:hover:scale-105",
                  colorId === item.id ? "border-[#20211F] ring-2 ring-white ring-inset" : "border-transparent",
                  pf.focus,
                )}
                style={{ background: item.hex }}
              />
            ))}
          </div>
        </fieldset>
        <p className={cn("flex items-start gap-2 rounded-xl bg-[#C5A46D]/14 p-3 text-13 leading-relaxed text-[#5C4A26]")}>
          <Info aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
          {copy.notice}
        </p>
      </div>

      {/* A pré-visualização: computador e telemóvel. Decorativa para leitores de ecrã, com descrição. */}
      <div className="relative pb-10 sm:pr-16" aria-live="polite">
        <figure aria-label={copy.browser} className="overflow-hidden rounded-2xl border border-[#EAEAE5] bg-white shadow-[0_30px_60px_-40px_rgba(32,33,31,0.5)]" data-testid="preview-browser">
          <div className="flex h-9 items-center gap-3 border-b border-[#EAEAE5] bg-[#F3F3EF] px-3">
            <span aria-hidden="true" className="flex gap-1.5">
              {[0, 1, 2].map((dot) => (
                <span key={dot} className="size-2.5 rounded-full bg-[#D8D8D1]" />
              ))}
            </span>
            <span className="mx-auto flex min-w-0 items-center gap-1.5 rounded-md bg-white px-3 py-0.5 text-12 text-[#6C6E67]">
              <Lock aria-hidden="true" size={10} />
              <span className="truncate">{slugHost(shown)}</span>
            </span>
            <span aria-hidden="true" className="w-12" />
          </div>
          <div className="h-[340px] sm:h-[380px]">
            <Mock name={shown} kind={kind} color={color} compact={false} />
          </div>
        </figure>
        <figure
          aria-label={copy.phone}
          className="absolute right-0 bottom-0 hidden w-[150px] overflow-hidden rounded-[26px] border-[6px] border-[#20211F] bg-white shadow-[0_30px_60px_-25px_rgba(32,33,31,0.6)] sm:block"
          data-testid="preview-phone"
        >
          <div className="h-[290px]">
            <Mock name={shown} kind={kind} color={color} compact />
          </div>
        </figure>
      </div>
    </div>
  );
}
