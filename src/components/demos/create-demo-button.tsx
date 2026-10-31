"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { createDemo, findMyDemo } from "@/lib/demos/actions";
import {
  MAX_ADDRESS,
  MAX_AUTHOR_NAME,
  MAX_COMPANY_NAME,
  MAX_LOCALITY,
  MAX_NICHE,
  MAX_PHONE,
  parseDemoDraft,
} from "@/lib/demos/rules";
import type { Company } from "@/lib/radar/types";

const { demos: copy } = ptPT;
const EMPTY_DRAFT = {
  companyName: "",
  niche: "",
  locality: "",
  address: "",
  phone: "",
};

// Os campos começam vazios de propósito: os dados do Google ficam ao lado, só para
// consulta, e o que se grava é o que o freelancer escreve.
export function CreateDemoButton({
  company,
  isSample,
}: {
  company: Company;
  isSample: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [checking, startChecking] = useTransition();
  const [open, setOpen] = useState(false);
  const [askName, setAskName] = useState(false);
  const [name, setName] = useState("");
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const update = (change: Partial<typeof EMPTY_DRAFT>) =>
    setDraft((current) => ({ ...current, ...change }));

  function handleOpen() {
    startChecking(async () => {
      const existing = await findMyDemo(company.id);
      if (existing) router.push(`/painel/demos/${existing}`);
      else setOpen(true);
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createDemo(company.id, draft, askName ? name : undefined);

      if (result.status === "needsName") {
        setAskName(true);
      } else if (result.status === "error") {
        toast.error(result.message);
      } else {
        setOpen(false);
        router.push(`/painel/demos/${result.id}`);
      }
    });
  }

  return (
    <>
      <Button
        ref={buttonRef}
        variant="secondary"
        loading={checking}
        loadingText={copy.pending}
        onClick={handleOpen}
      >
        {copy.create}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-2xl"
          // Abre depois de uma verificação, por isso o foco volta ao botão à mão.
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            buttonRef.current?.focus();
          }}
        >
          <DialogTitle>{copy.form.title}</DialogTitle>
          <DialogDescription>{copy.form.body}</DialogDescription>
          <p className="rounded-md border border-amber p-3 text-14">
            {copy.form.warning}
          </p>
          <section
            aria-label={copy.form.referenceTitle}
            data-testid="demo-reference"
            className="flex flex-col gap-2 rounded-md border border-border p-3 text-14"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{copy.form.referenceTitle}</h3>
              {isSample && <Badge variant="amber">{ptPT.radar.sampleBadge}</Badge>}
            </div>
            <p>{company.name}</p>
            <p>{company.address}</p>
            {company.phone && <p>{company.phone}</p>}
            {!isSample && (
              <p className="text-13 text-muted">{ptPT.radar.attribution}</p>
            )}
          </section>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label={copy.editor.companyName}>
              <Input
                value={draft.companyName}
                maxLength={MAX_COMPANY_NAME}
                autoComplete="off"
                required
                onChange={(event) => update({ companyName: event.target.value })}
              />
            </Field>
            <Field label={copy.editor.niche}>
              <Input
                value={draft.niche}
                maxLength={MAX_NICHE}
                autoComplete="off"
                required
                onChange={(event) => update({ niche: event.target.value })}
              />
            </Field>
            <Field label={copy.editor.locality}>
              <Input
                value={draft.locality}
                maxLength={MAX_LOCALITY}
                autoComplete="off"
                required
                onChange={(event) => update({ locality: event.target.value })}
              />
            </Field>
            <Field label={copy.editor.address}>
              <Input
                value={draft.address}
                maxLength={MAX_ADDRESS}
                autoComplete="off"
                required
                onChange={(event) => update({ address: event.target.value })}
              />
            </Field>
            <Field label={copy.editor.phone}>
              <Input
                type="tel"
                value={draft.phone}
                maxLength={MAX_PHONE}
                autoComplete="off"
                onChange={(event) => update({ phone: event.target.value })}
              />
            </Field>
            {askName && (
              <Field label={copy.nameDialog.label} help={copy.nameDialog.body}>
                <Input
                  value={name}
                  maxLength={MAX_AUTHOR_NAME}
                  autoComplete="name"
                  required
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>
            )}
            <Button
              type="submit"
              loading={pending}
              loadingText={copy.pending}
              disabled={!parseDemoDraft(draft) || (askName && !name.trim())}
            >
              {copy.create}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
