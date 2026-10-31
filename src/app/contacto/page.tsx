import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { ptPT } from "@/i18n/pt-PT";

const { contact: copy } = ptPT.legal;

export const metadata: Metadata = { title: copy.title };

export default function ContactPage() {
  return <LegalPage title={copy.title} paragraphs={copy.paragraphs} />;
}
