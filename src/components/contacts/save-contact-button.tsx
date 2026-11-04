"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { saveContact } from "@/lib/contacts/actions";
import { MAX_LABEL } from "@/lib/contacts/rules";

const { contacts: copy } = ptPT;

// O campo começa vazio de propósito: o nome é escrito pelo freelancer, não copiado do Google.
export function SaveContactButton({
  companyId,
  onSaved,
}: {
  companyId: string;
  onSaved?: (companyId: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const { ok } = await saveContact(companyId, label);

      if (ok) {
        setOpen(false);
        setLabel("");
        toast.success(copy.savedToContacts);
        onSaved?.(companyId);
      } else {
        toast.error(copy.errors.generic);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">{copy.saveToContacts}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{copy.saveDialog.title}</DialogTitle>
        <DialogDescription>{copy.saveDialog.body}</DialogDescription>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label={copy.saveDialog.label}>
            <Input
              value={label}
              maxLength={MAX_LABEL}
              required
              autoComplete="off"
              onChange={(event) => setLabel(event.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={pending} loadingText={copy.saving}>
              {copy.saveDialog.submit}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {copy.saveDialog.cancel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
