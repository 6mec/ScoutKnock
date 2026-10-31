"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { saveContact } from "@/lib/contacts/actions";

const { contacts: copy } = ptPT;

export function SaveContactButton({ companyId }: { companyId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const { ok } = await saveContact(companyId);

      if (ok) toast.success(copy.savedToContacts);
      else toast.error(copy.errors.generic);
    });
  }

  return (
    <Button
      variant="secondary"
      loading={pending}
      loadingText={copy.saving}
      onClick={handleClick}
    >
      {copy.saveToContacts}
    </Button>
  );
}
