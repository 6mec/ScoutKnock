import type { ReactNode } from "react";

// O layout mantém o cartão; só o conteúdo troca ao navegar.
export default function AuthTemplate({ children }: { children: ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
