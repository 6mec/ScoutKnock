"use client";

import { Menu, X } from "lucide-react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ptPT } from "@/i18n/pt-PT";
import { cn } from "@/lib/utils";

const copy = ptPT.landing;

const LINKS = [
  { href: "#como-funciona", label: copy.nav.howItWorks },
  { href: "#perguntas", label: copy.nav.faq },
];

export function LandingHeader() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => setScrolled(value > 8));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-30 border-b transition-colors duration-(--duration-fast) ease-out",
        scrolled
          ? "border-border bg-background/80 backdrop-blur-md"
          : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-18 w-full max-w-300 items-center justify-between gap-4 px-4 lg:px-10">
        <a href="#topo" className="focus-ring rounded-sm">
          <Logo />
        </a>

        <nav
          aria-label={copy.nav.label}
          className="hidden items-center gap-7 md:flex"
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="focus-ring rounded-sm py-2.5 text-muted transition-colors duration-(--duration-fast) ease-out hovered:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <Button asChild variant="secondary">
            <a href="#lista-de-espera">{copy.joinButton}</a>
          </Button>
        </nav>

        <DialogPrimitive.Root>
          <DialogPrimitive.Trigger asChild>
            <Button
              variant="ghost"
              aria-label={copy.nav.openMenu}
              className="size-11 px-0 md:hidden"
            >
              <Menu aria-hidden="true" size={20} strokeWidth={1.75} />
            </Button>
          </DialogPrimitive.Trigger>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-canvas/80 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
            <DialogPrimitive.Content
              aria-describedby={undefined}
              className="fixed inset-y-0 right-0 z-50 flex w-[min(320px,85vw)] flex-col gap-6 border-l border-border bg-surface-raised p-6 shadow-float data-[state=closed]:animate-slide-out-right data-[state=open]:animate-slide-in-right"
            >
              <div className="flex items-center justify-between">
                <DialogPrimitive.Title className="section-label text-muted">
                  {copy.nav.menu}
                </DialogPrimitive.Title>
                <DialogPrimitive.Close asChild>
                  <Button
                    variant="ghost"
                    aria-label={ptPT.ui.close}
                    className="size-11 px-0"
                  >
                    <X aria-hidden="true" size={20} strokeWidth={1.75} />
                  </Button>
                </DialogPrimitive.Close>
              </div>
              <nav aria-label={copy.nav.label} className="flex flex-col gap-2">
                {LINKS.map((link) => (
                  <DialogPrimitive.Close key={link.href} asChild>
                    <a
                      href={link.href}
                      className="focus-ring flex min-h-11 items-center rounded-sm text-18"
                    >
                      {link.label}
                    </a>
                  </DialogPrimitive.Close>
                ))}
              </nav>
              <DialogPrimitive.Close asChild>
                <Button asChild size="lg">
                  <a href="#lista-de-espera">{copy.joinButton}</a>
                </Button>
              </DialogPrimitive.Close>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </div>
    </header>
  );
}
