import type { ReactNode } from "react";

// O layout mantém o cartão. Sem desvanecer ao entrar: o texto do formulário tem de
// estar legível desde o primeiro instante.
export default function AuthTemplate({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
