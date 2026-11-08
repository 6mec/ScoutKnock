"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ptPT } from "@/i18n/pt-PT";
import { cn } from "@/lib/utils";
import { pf } from "./styles";

const copy = ptPT.portfolio.showcase.nav;

// Topo com âncoras: no computador em linha, no telemóvel num menu que abre e fecha.
export function PublicNav({
  name,
  initials,
  links,
  contactHref,
  sticky,
}: {
  name: string;
  initials: string;
  links: { href: string; label: string }[];
  contactHref: string | null;
  sticky: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("z-30 border-b border-[#EAEAE5] bg-[#F7F7F4]/85 backdrop-blur-xl", sticky && "sticky top-0")}>
      <div className={cn(pf.container, "flex h-16 items-center justify-between gap-4")}>
        <span className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#20211F] text-13 font-semibold text-white">
            {initials}
          </span>
          <span className="truncate text-15 font-semibold tracking-tight">{name}</span>
        </span>
        <nav aria-label={copy.label} className="flex items-center gap-1">
          <ul className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={cn("rounded-full px-3 py-2 text-14 text-[#6C6E67] transition-colors hover:text-[#20211F]", pf.focus)}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          {contactHref && (
            <a href={contactHref} className={cn("ml-2 hidden min-h-10 items-center rounded-full bg-[#20211F] px-4 text-14 font-semibold text-white transition-colors hover:bg-[#3A3B37] sm:inline-flex", pf.focus)}>
              {copy.contact}
            </a>
          )}
          <button
            type="button"
            aria-expanded={open}
            aria-controls="pf-mobile-menu"
            aria-label={open ? copy.close : copy.menu}
            onClick={() => setOpen((value) => !value)}
            className={cn("ml-1 inline-flex size-11 items-center justify-center rounded-full border border-[#EAEAE5] bg-white lg:hidden", pf.focus)}
          >
            {open ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}
          </button>
        </nav>
      </div>
      {open && (
        <ul id="pf-mobile-menu" className={cn(pf.container, "flex flex-col gap-1 pb-4 lg:hidden")}>
          {[...links, ...(contactHref ? [{ href: contactHref, label: copy.contact }] : [])].map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn("flex min-h-11 items-center rounded-xl px-3 text-15 font-medium hover:bg-white", pf.focus)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
