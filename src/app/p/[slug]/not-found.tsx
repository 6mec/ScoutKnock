import type { Metadata } from "next";
import Link from "next/link";
import { SystemMessage } from "@/components/system-message";
import { Button } from "@/components/ui/button";
import { ptPT } from "@/i18n/pt-PT";

export const metadata: Metadata = {
  title: ptPT.system.notFound,
  robots: { index: false, follow: false },
};

// Portfólio que não existe ou foi despublicado.
export default function PortfolioNotFound() {
  return (
    <SystemMessage
      title={ptPT.portfolio.page.notFound}
      action={
        <Button asChild variant="secondary">
          <Link href="/">{ptPT.system.home}</Link>
        </Button>
      }
    />
  );
}
