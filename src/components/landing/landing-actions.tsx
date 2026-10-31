"use client";

import Link from "next/link";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Button } from "@/components/ui/button";
import { ptPT } from "@/i18n/pt-PT";

const copy = ptPT.landing;
const TEXT_LINK =
  "focus-ring inline-flex min-h-11 items-center rounded-sm whitespace-nowrap text-muted transition-colors duration-(--duration-fast) ease-out hovered:text-foreground";

export type LandingActionsVariant = "desktop" | "bar" | "drawer";

export function LandingActions({
  variant,
  signedIn,
}: {
  variant: LandingActionsVariant;
  signedIn: boolean;
}) {
  if (variant === "drawer") {
    return signedIn ? (
      <DialogPrimitive.Close asChild>
        <Button asChild size="lg">
          <Link href="/painel">{copy.nav.goToPanel}</Link>
        </Button>
      </DialogPrimitive.Close>
    ) : (
      <>
        <DialogPrimitive.Close asChild>
          <Button asChild size="lg">
            <a href="#lista-de-espera">{copy.joinButton}</a>
          </Button>
        </DialogPrimitive.Close>
        <DialogPrimitive.Close asChild>
          <Link href="/entrar" className={`${TEXT_LINK} text-18`}>
            {copy.nav.signIn}
          </Link>
        </DialogPrimitive.Close>
      </>
    );
  }

  if (variant === "bar") {
    return signedIn ? (
      <Button asChild variant="secondary" size="sm">
        <Link href="/painel">{copy.nav.goToPanel}</Link>
      </Button>
    ) : (
      <Link href="/entrar" className={TEXT_LINK}>
        {copy.nav.signIn}
      </Link>
    );
  }

  return signedIn ? (
    <Button asChild variant="secondary">
      <Link href="/painel">{copy.nav.goToPanel}</Link>
    </Button>
  ) : (
    <>
      <Link href="/entrar" className={TEXT_LINK}>
        {copy.nav.signIn}
      </Link>
      <Button asChild variant="secondary">
        <a href="#lista-de-espera">{copy.joinButton}</a>
      </Button>
    </>
  );
}
