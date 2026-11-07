"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ptPT } from "@/i18n/pt-PT";
import { cn } from "@/lib/utils";

const copy = ptPT.portfolio.page;

// Botão de WhatsApp fixo no fundo, só em ecrãs pequenos: aparece quando o topo sai de vista
// e esconde-se quando o contacto final está no ecrã (para não haver dois botões iguais).
// A página reserva espaço por baixo, por isso não tapa conteúdo.
export function WhatsAppBar({ href, heroId, contactId }: { href: string; heroId: string; contactId: string }) {
  const [pastHero, setPastHero] = useState(false);
  const [atContact, setAtContact] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(heroId);
    const contact = document.getElementById(contactId);
    if (!hero || !contact || !("IntersectionObserver" in window)) return;
    const heroObserver = new IntersectionObserver(([entry]) => {
      setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    const contactObserver = new IntersectionObserver(([entry]) => setAtContact(entry.isIntersecting));
    heroObserver.observe(hero);
    contactObserver.observe(contact);
    return () => {
      heroObserver.disconnect();
      contactObserver.disconnect();
    };
  }, [heroId, contactId]);

  const shown = pastHero && !atContact;

  return (
    <div
      role="region"
      aria-label={copy.barLabel}
      aria-hidden={!shown}
      inert={!shown}
      data-testid="pf-whatsapp-bar"
      data-shown={shown || undefined}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-[#e3e8ee] bg-white/95 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom)+var(--badge-space))] backdrop-blur sm:hidden print:hidden",
        "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out",
        shown ? "translate-y-0" : "translate-y-full",
      )}
    >
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0a7f5b] text-16 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a7f5b]"
      >
        <MessageCircle aria-hidden="true" size={19} strokeWidth={1.9} />
        {copy.whatsapp}
      </a>
    </div>
  );
}
