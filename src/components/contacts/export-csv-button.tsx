"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ptPT } from "@/i18n/pt-PT";
import { contactsCsv, dayOf } from "@/lib/contacts/crm";
import type { Contact } from "@/lib/contacts/rules";

const { contacts: copy } = ptPT;

// Gerado no browser: não há pedido ao servidor nem cópia guardada.
export function ExportCsvButton({ contacts }: { contacts: Contact[] }) {
  function download() {
    const csv = contactsCsv(contacts, copy.crm.exportHeaders, (status) => copy.statuses[status]);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = Object.assign(document.createElement("a"), {
      href: url,
      download: copy.crm.exportFile(dayOf(Date.now())),
    });
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <Button variant="secondary" onClick={download} disabled={contacts.length === 0} title={copy.crm.exportNote}>
      <Download aria-hidden="true" size={16} strokeWidth={1.75} />
      {copy.crm.export}
    </Button>
  );
}
