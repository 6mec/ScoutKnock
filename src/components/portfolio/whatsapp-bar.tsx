"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ptPT } from "@/i18n/pt-PT";
import { cn } from "@/lib/utils";

const copy = ptPT.portfolio.page;

// Botão de WhatsApp fixo no fundo, só no telemóvel. Aparece apenas quando nenhum dos outros
// botões do WhatsApp (o do destaque e o do contacto) está no ecrã, para nunca haver dois.
// A página reserva espaço por baixo, por isso não tapa conteúdo.
export function WhatsAppBar({ href, watchIds }: { href: string; watchIds: string[] }) {
  const [visible, setVisible] = useState<Record<string, boolean>>(() => Object.fromEntries(watchIds.map((id) => [id, true])));
  const key = watchIds.join("|");

  useEffect(() => {
    const ids = key.split("|");
    const targets = ids.map((id) => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node));
    if (targets.length === 0 || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      setVisible((current) => {
        const next = { ...current };
        for (const entry of entries) next[entry.target.id] = entry.isIntersecting;
        return next;
      });
    });
    targets.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [key]);

  const shown = Object.values(visible).every((value) => !value);

  return (
    <div
      role="region"
      aria-label={copy.barLabel}
      aria-hidden={!shown}
      inert={!shown}
      data-testid="pf-whatsapp-bar"
      data-shown={shown || undefined}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-[#EAEAE5] bg-[#F7F7F4]/95 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom)+var(--badge-space))] backdrop-blur sm:hidden print:hidden",
        "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out",
        shown ? "translate-y-0" : "translate-y-full",
      )}
    >
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#5A7059] text-16 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5A7059]"
      >
        <MessageCircle aria-hidden="true" size={19} strokeWidth={1.9} />
        {copy.whatsapp}
      </a>
    </div>
  );
}
