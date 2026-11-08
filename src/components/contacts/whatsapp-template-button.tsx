"use client";

import { MessageSquareText } from "lucide-react";
import { useState, useTransition } from "react";
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
import { setWhatsappTemplate } from "@/lib/contacts/actions";
import { MAX_WHATSAPP_TEMPLATE } from "@/lib/contacts/crm";
import { templateText } from "./whatsapp-call-button";

const { contacts: copy } = ptPT;

export function WhatsappTemplateButton({
  template,
  onSaved,
}: {
  template: string | null;
  onSaved: (template: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(templateText(template));
  const [saving, startSaving] = useTransition();
  const tooLong = draft.trim().length > MAX_WHATSAPP_TEMPLATE;

  function save() {
    // Igual ao modelo da app (ou vazio) guarda-se como null: segue o modelo se mudar.
    const text = draft.trim();
    const value = !text || text === copy.crm.templateDefault ? null : text;
    startSaving(async () => {
      const { ok } = await setWhatsappTemplate(value ?? "");
      if (ok) {
        onSaved(value);
        setOpen(false);
        toast.success(copy.crm.templateSaved);
      } else {
        toast.error(copy.errors.generic);
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => {
          setDraft(templateText(template));
          setOpen(true);
        }}
      >
        <MessageSquareText aria-hidden="true" size={16} strokeWidth={1.75} />
        {copy.crm.templateButton}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{copy.crm.templateTitle}</DialogTitle>
          <DialogDescription>{copy.crm.templateBody}</DialogDescription>
          <Field
            label={copy.crm.templateLabel}
            error={tooLong ? copy.crm.templateInvalid(MAX_WHATSAPP_TEMPLATE) : undefined}
          >
            <Textarea rows={5} value={draft} onChange={(event) => setDraft(event.target.value)} />
          </Field>
          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="ghost" onClick={() => setDraft(copy.crm.templateDefault)}>
              {copy.crm.templateReset}
            </Button>
            <Button loading={saving} loadingText={copy.saving} disabled={tooLong} onClick={save}>
              {copy.crm.templateSave}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
