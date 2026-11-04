"use client";

import { Check, ChevronDown } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ptPT } from "@/i18n/pt-PT";
import { CONTACT_STATUSES, type Contact, type ContactStatus } from "@/lib/contacts/rules";
import { StatusDot } from "./status-dot";

const { contacts: copy } = ptPT;

// A alternativa ao arrasto: funciona com teclado e leitor de ecrã.
export function StatusMenu({
  contact,
  onChange,
}: {
  contact: Contact;
  onChange: (id: string, status: ContactStatus) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Ao mudar de coluna o cartão é recriado: o foco segue para o botão novo.
  function restoreFocus(event: Event) {
    event.preventDefault();
    requestAnimationFrame(() => {
      const trigger = triggerRef.current?.isConnected
        ? triggerRef.current
        : document.querySelector<HTMLElement>(`[data-status-menu="${contact.id}"]`);
      trigger?.focus();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
          data-status-menu={contact.id}
          variant="secondary"
          size="sm"
          aria-label={`${copy.changeStatus}: ${contact.label}, ${copy.statuses[contact.status]}`}
        >
          <StatusDot status={contact.status} />
          {copy.statuses[contact.status]}
          <ChevronDown aria-hidden="true" size={14} strokeWidth={1.75} className="text-muted" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onCloseAutoFocus={restoreFocus}>
        {CONTACT_STATUSES.map((status) => (
          <DropdownMenuItem
            key={status}
            onSelect={() => onChange(contact.id, status)}
            aria-current={status === contact.status || undefined}
          >
            <span className="inline-flex size-4 items-center justify-center">
              {status === contact.status && (
                <Check aria-hidden="true" size={14} strokeWidth={2} />
              )}
            </span>
            <StatusDot status={status} />
            {copy.statuses[status]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
