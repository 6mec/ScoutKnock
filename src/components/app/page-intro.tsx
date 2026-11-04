import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Título e descrição de um ecrã, fora do Suspense: aparecem logo, antes dos dados
// (é o que o telemóvel mostra primeiro e o que o Lighthouse mede).
export function PageIntro({
  title,
  description,
  before,
  className,
}: {
  title: string;
  description: string;
  before?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1 px-4 pt-6 lg:px-8", className)}>
      {before}
      <h2 className="type-heading text-24">{title}</h2>
      <p className="type-body text-15 text-muted">{description}</p>
    </div>
  );
}
