import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { ptPT } from "@/i18n/pt-PT";

const { terms: copy } = ptPT.legal;

export const metadata: Metadata = { title: copy.title };

export default function TermsPage() {
  return <LegalPage title={copy.title} paragraphs={copy.paragraphs} />;
}
