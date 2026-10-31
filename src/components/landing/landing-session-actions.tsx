import { Suspense } from "react";
import { hasSession } from "@/lib/auth/has-session";
import { LandingActions, type LandingActionsVariant } from "./landing-actions";

async function Resolved({ variant }: { variant: LandingActionsVariant }) {
  return <LandingActions variant={variant} signedIn={await hasSession()} />;
}

// A página é pré-gerada: esta zona resolve-se no pedido. Até lá fica vazia, nunca
// com o botão errado, e o espaço reservado à volta evita que o resto salte.
export function LandingSessionActions({
  variant,
}: {
  variant: LandingActionsVariant;
}) {
  return (
    <Suspense>
      <Resolved variant={variant} />
    </Suspense>
  );
}
