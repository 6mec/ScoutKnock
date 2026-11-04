"use client";

import { Plus } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { addManualContact } from "@/lib/contacts/actions";
import type { Contact } from "@/lib/contacts/rules";
import {
  ManualCompanyFields,
  emptyManualForm,
  manualInput,
  parseManualForm,
  type ManualForm,
} from "./manual-company-fields";

const copy = ptPT.contacts.manual;

export function AddCompanyButton({
  initial,
  onAdded,
  variant = "secondary",
}: {
  initial?: Partial<ManualForm>;
  onAdded?: (contact: Contact) => void;
  variant?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => emptyManualForm(initial));
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function openDialog() {
    setForm(emptyManualForm(initial));
    setError(false);
    setOpen(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!parseManualForm(form)) {
      setError(true);
      return;
    }
    startTransition(async () => {
      const result = await addManualContact(manualInput(form));
      if (!result.ok) {
        toast.error(ptPT.contacts.errors.generic);
        return;
      }
      setOpen(false);
      toast.success(copy.added);
      onAdded?.(result.contact);
    });
  }

  return (
    <>
      <Button variant={variant} onClick={openDialog}>
        <Plus aria-hidden="true" size={16} strokeWidth={1.75} />
        {copy.add}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>{copy.addTitle}</DialogTitle>
          <DialogDescription>{copy.addBody}</DialogDescription>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <ManualCompanyFields
              form={form}
              onChange={(next) => {
                setForm(next);
                setError(false);
              }}
              autoFocus
            />
            <div aria-live="polite">
              {error && (
                <p role="alert" className="text-14 text-danger">
                  {copy.invalid}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" loading={pending} loadingText={ptPT.contacts.saving}>
                {copy.submit}
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
