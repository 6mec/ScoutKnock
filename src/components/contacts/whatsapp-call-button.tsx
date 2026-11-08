"use client";

import { MessageCircle } from "lucide-react";
import { createContext, use } from "react";
import { Button, type ButtonSize } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { fillTemplate } from "@/lib/contacts/crm";
import type { Contact, ContactStatus } from "@/lib/contacts/rules";
import { whatsappNumber, whatsappUrl } from "@/lib/messages/rules";
import { EMPTY_DEMO_LINKS, demoLinkFor, missingVariables, type DemoLinks } from "@/lib/demos/links";

const { contacts: copy } = ptPT;

// Link do portfólio publicado, para o {link_portfolio} da mensagem.
export const PortfolioLinkContext = createContext<string | null>(null);
// Demos de cada empresa e "exemplos do nicho", para o {link_demo}.
export const DemoLinksContext = createContext<DemoLinks>(EMPTY_DEMO_LINKS);

export function templateText(template: string | null) {
  return template ?? copy.crm.templateDefault;
}

// Abre a conversa no WhatsApp com a mensagem do freelancer: o envio é sempre dele,
// um a um. Uma empresa por contactar passa a "Contactado" e conta para a meta.
export function WhatsappCallButton({
  contact,
  phone,
  template,
  onStatusChange,
  size,
}: {
  contact: Contact;
  phone: string | null | undefined;
  template: string | null;
  onStatusChange: (id: string, status: ContactStatus) => void;
  size?: ButtonSize;
}) {
  const portfolio = use(PortfolioLinkContext);
  const demo = demoLinkFor(use(DemoLinksContext), contact);
  if (contact.do_not_contact) return null;
  if (!whatsappNumber(phone)) {
    return <p className="text-13 text-muted">{copy.crm.whatsappNoPhone}</p>;
  }

  const missing = missingVariables(templateText(template), { demo, portfolio });
  return (
    <span className="inline-flex flex-col gap-1">
      <Button asChild size={size}>
        <a
          href={whatsappUrl(fillTemplate(templateText(template), contact.label, portfolio, demo), phone)}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={copy.crm.whatsappLabel(contact.label)}
          onClick={() => {
            if (contact.status === "to_contact") {
              onStatusChange(contact.id, "contacted");
              toast.success(copy.crm.whatsappMarked);
            }
          }}
        >
          <MessageCircle aria-hidden="true" size={16} strokeWidth={1.9} />
          {copy.crm.whatsapp}
        </a>
      </Button>
      {missing.length > 0 && (
        <span className="text-12 text-amber" data-testid="whatsapp-missing">
          {copy.crm.missingVariables(missing.map((item) => copy.crm.variableNames[item]).join(" e "))}
        </span>
      )}
    </span>
  );
}
