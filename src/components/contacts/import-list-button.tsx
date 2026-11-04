"use client";

import { ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { importManualContacts } from "@/lib/contacts/actions";
import { MAX_IMPORT_ROWS, parseCompanyList } from "@/lib/contacts/manual";
import type { Contact } from "@/lib/contacts/rules";

const copy = ptPT.contacts.manual;

export function ImportListButton({ contacts }: { contacts: Contact[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  // A pré-visualização usa as mesmas regras do servidor, que volta a verificar tudo.
  const preview = parseCompanyList(
    text,
    contacts.map((contact) => ({
      label: contact.label,
      phone: contact.manual_phone ?? contact.confirmed_contact,
    })),
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await importManualContacts(text);
      if (!result.ok) {
        toast.error(ptPT.contacts.errors.generic);
        return;
      }
      if (result.added === 0) {
        toast.error(copy.importNothing);
        return;
      }
      toast.success(copy.imported(result.added, result.duplicates));
      setOpen(false);
      setText("");
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <ClipboardList aria-hidden="true" size={16} strokeWidth={1.75} />
        {copy.importButton}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>{copy.importTitle}</DialogTitle>
          <DialogDescription>{copy.importBody}</DialogDescription>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label={copy.importLabel}>
              <Textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="type-number min-h-48 text-14"
                spellCheck={false}
              />
            </Field>
            <p role="status" className="text-14 text-muted">
              {text.trim()
                ? copy.importPreview(
                    preview.companies.length,
                    preview.duplicates,
                    preview.invalid,
                  )
                : null}
              {preview.tooMany && ` ${copy.importTooMany(MAX_IMPORT_ROWS)}`}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                loading={pending}
                loadingText={ptPT.contacts.saving}
                disabled={preview.companies.length === 0}
              >
                {copy.importSubmit}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {copy.cancel}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
