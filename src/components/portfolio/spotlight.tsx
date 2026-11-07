"use client";

import type { PointerEvent, ReactNode } from "react";

// Passa a posição do rato aos cartões com a classe pf-spot (o brilho é desenhado em CSS).
// Um só ouvinte por lista; no toque não faz nada.
export function Spotlight({ className, children }: { className?: string; children: ReactNode }) {
  function move(event: PointerEvent<HTMLUListElement>) {
    if (event.pointerType !== "mouse") return;
    const card = (event.target as HTMLElement).closest<HTMLElement>(".pf-spot");
    if (!card) return;
    const box = card.getBoundingClientRect();
    card.style.setProperty("--pf-x", `${event.clientX - box.left}px`);
    card.style.setProperty("--pf-y", `${event.clientY - box.top}px`);
  }
  return (
    <ul className={className} onPointerMove={move}>
      {children}
    </ul>
  );
}
