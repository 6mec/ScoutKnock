import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { ptPT } from "@/i18n/pt-PT";
import { parseBotContact } from "@/lib/radar/site-budget";

const { bot: copy } = ptPT;

export const metadata: Metadata = { title: copy.title };

// Gerada no build: mudar o nome ou o email obriga a publicar de novo.
export default function BotPage() {
  const contact = parseBotContact(process.env);

  return (
    <LegalPage
      href="/bot"
      title={copy.title}
      paragraphs={
        contact
          ? [...copy.paragraphs, copy.contact(contact.name, contact.email)]
          : copy.paragraphs
      }
    />
  );
}
