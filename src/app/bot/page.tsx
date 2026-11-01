import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { ptPT } from "@/i18n/pt-PT";

const { bot: copy } = ptPT;

export const metadata: Metadata = { title: copy.title };

export default function BotPage() {
  return <LegalPage href="/bot" title={copy.title} paragraphs={copy.paragraphs} />;
}
