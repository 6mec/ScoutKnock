"use client";

import { Check, Mail, MessageCircle } from "lucide-react";
import { useState } from "react";
import { ptPT } from "@/i18n/pt-PT";
import { whatsappUrl } from "@/lib/messages/rules";
import {
  BUILDER_DEADLINES,
  BUILDER_FEATURES,
  BUILDER_KINDS,
  builderMessage,
  type BuilderDeadline,
  type BuilderFeature,
  type BuilderKind,
} from "@/lib/portfolio/showcase";
import { cn } from "@/lib/utils";
import { pf } from "./styles";

const copy = ptPT.portfolio.showcase.builder;

// "Monta o teu projeto": o visitante escolhe e o botão abre o WhatsApp com a mensagem
// pronta (é ele que a envia). Sem preços. Sem WhatsApp no portfólio, abre o email.
export function ProjectBuilder({ owner, whatsapp, email }: { owner: string; whatsapp: string | null; email: string | null }) {
  const [kind, setKind] = useState<BuilderKind>("site");
  const [features, setFeatures] = useState<BuilderFeature[]>([]);
  const [deadline, setDeadline] = useState<BuilderDeadline>("flexible");

  const message = builderMessage(copy.message, {
    owner,
    kind: copy.kinds[kind],
    features: BUILDER_FEATURES.filter((item) => features.includes(item)).map((item) => copy.featureNames[item]),
    deadline: copy.deadlines[deadline],
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start" data-testid="project-builder">
      <div className={cn(pf.card, "flex flex-col gap-6 p-5 sm:p-6")}>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-14 font-semibold">{copy.kind}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {BUILDER_KINDS.map((item) => (
              <label
                key={item}
                className={cn(
                  "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 text-15 font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-[#647B63]",
                  kind === item ? "border-[#647B63] bg-[#647B63]/10" : "border-[#EAEAE5] bg-white hover:border-[#647B63]",
                )}
              >
                <input type="radio" name="builder-kind" value={item} checked={kind === item} onChange={() => setKind(item)} className="size-4 accent-[#647B63]" />
                {copy.kinds[item]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-14 font-semibold">{copy.features}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {BUILDER_FEATURES.map((item) => {
              const on = features.includes(item);
              return (
                <label
                  key={item}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-4 text-14 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-[#647B63]",
                    on ? "border-[#647B63] bg-[#647B63]/10" : "border-[#EAEAE5] bg-white hover:border-[#647B63]",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => setFeatures((list) => (on ? list.filter((value) => value !== item) : [...list, item]))}
                    className="size-4 accent-[#647B63]"
                  />
                  {copy.featureNames[item]}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-14 font-semibold">{copy.deadline}</legend>
          <div className="flex flex-wrap gap-2">
            {BUILDER_DEADLINES.map((item) => (
              <label
                key={item}
                className={cn(pf.chip, "cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-[#647B63]", deadline === item ? pf.chipOn : pf.chipOff)}
              >
                <input type="radio" name="builder-deadline" value={item} checked={deadline === item} onChange={() => setDeadline(item)} className="sr-only" />
                {deadline === item && <Check aria-hidden="true" size={14} />}
                {copy.deadlines[item]}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={cn(pf.card, "flex flex-col gap-4 p-5 sm:p-6 lg:sticky lg:top-24")}>
        <h3 className="text-15 font-semibold">{copy.summary}</h3>
        <p className="rounded-xl bg-[#F7F7F4] p-4 text-14 leading-relaxed whitespace-pre-line" data-testid="builder-message">
          {message}
        </p>
        {whatsapp ? (
          <a href={whatsappUrl(message, whatsapp)} target="_blank" rel="noreferrer noopener" className={cn(pf.primary, pf.focus)} data-testid="builder-send">
            <MessageCircle aria-hidden="true" size={18} />
            {copy.send}
          </a>
        ) : (
          email && (
            <a href={`mailto:${email}?subject=${encodeURIComponent(copy.emailSubject)}&body=${encodeURIComponent(message)}`} className={cn(pf.primary, pf.focus)} data-testid="builder-send">
              <Mail aria-hidden="true" size={18} />
              {copy.sendEmail}
            </a>
          )
        )}
        <p className={cn("text-13", pf.muted)}>{copy.noPrices}</p>
      </div>
    </div>
  );
}
