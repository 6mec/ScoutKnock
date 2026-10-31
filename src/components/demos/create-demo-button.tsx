"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
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
import { createDemo } from "@/lib/demos/actions";
import { MAX_AUTHOR_NAME } from "@/lib/demos/rules";

const { demos: copy } = ptPT;

export function CreateDemoButton({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [askName, setAskName] = useState(false);
  const [name, setName] = useState("");

  function create(authorName?: string) {
    startTransition(async () => {
      const result = await createDemo(companyId, authorName);

      if (result.status === "needsName") {
        setAskName(true);
      } else if (result.status === "error") {
        toast.error(result.message);
      } else {
        setAskName(false);
        router.push(`/painel/demos/${result.id}`);
      }
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    create(name);
  }

  return (
    <>
      <Button
        variant="secondary"
        loading={pending && !askName}
        loadingText={copy.pending}
        onClick={() => create()}
      >
        {copy.create}
      </Button>
      <Dialog open={askName} onOpenChange={setAskName}>
        <DialogContent>
          <DialogTitle>{copy.nameDialog.title}</DialogTitle>
          <DialogDescription>{copy.nameDialog.body}</DialogDescription>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label={copy.nameDialog.label}>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={MAX_AUTHOR_NAME}
                autoComplete="name"
                required
              />
            </Field>
            <Button
              type="submit"
              loading={pending}
              loadingText={copy.pending}
              disabled={!name.trim()}
            >
              {copy.create}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
