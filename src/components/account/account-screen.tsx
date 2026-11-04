"use client";

import { KeyRound, Palette, Trash2 } from "lucide-react";
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
import { PanelHeader } from "@/components/ui/panel-header";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import {
  deleteAccount,
  saveDisplayName,
  sendPasswordEmail,
} from "@/lib/account/actions";
import { DELETE_CONFIRMATION, isDeleteConfirmed } from "@/lib/account/rules";
import { setTheme, useTheme, type Theme } from "@/lib/theme";
import { MAX_AUTHOR_NAME, parseAuthorName } from "@/lib/demos/rules";

const { account: copy } = ptPT;
const THEMES: Theme[] = ["dark", "light"];
const cardClasses = "panel flex flex-col gap-4 p-6";

export function AccountScreen({
  email,
  displayName,
}: {
  email: string;
  displayName: string;
}) {
  const theme = useTheme();
  const [name, setName] = useState(displayName);
  const [confirmation, setConfirmation] = useState("");
  const [saving, startSaving] = useTransition();
  const [sending, startSending] = useTransition();
  const [deleting, startDeleting] = useTransition();

  function handleSave(event: FormEvent) {
    event.preventDefault();
    startSaving(async () => {
      const { ok } = await saveDisplayName(name);
      if (ok) toast.success(copy.saved);
      else toast.error(copy.errors.generic);
    });
  }

  function handlePasswordEmail() {
    startSending(async () => {
      const { ok, rateLimited } = await sendPasswordEmail();
      if (ok) toast.success(copy.passwordEmailSent);
      else toast.error(rateLimited ? ptPT.auth.errors.rateLimited : copy.errors.generic);
    });
  }

  function handleDelete(event: FormEvent) {
    event.preventDefault();
    startDeleting(async () => {
      // Quando corre bem, a ação redireciona e não chega a devolver.
      const result = await deleteAccount(confirmation);
      if (!result.ok) toast.error(copy.errors.generic);
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-6 pb-8 lg:px-8">
      <form onSubmit={handleSave} className={cardClasses}>
        <Field label={ptPT.auth.fields.email}>
          <Input value={email} readOnly />
        </Field>
        <Field label={copy.name}>
          <Input
            value={name}
            maxLength={MAX_AUTHOR_NAME}
            autoComplete="name"
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Button
          type="submit"
          loading={saving}
          loadingText={copy.saving}
          disabled={!parseAuthorName(name)}
          className="self-start"
        >
          {copy.save}
        </Button>
      </form>

      <section aria-labelledby="account-theme" className={cardClasses}>
        <PanelHeader id="account-theme" icon={Palette} title={copy.theme} />
        <div role="group" aria-labelledby="account-theme" className="flex gap-2">
          {THEMES.map((id) => (
            <Button
              key={id}
              variant={theme === id ? "primary" : "secondary"}
              aria-pressed={theme === id}
              onClick={() => setTheme(id)}
            >
              {copy.themes[id]}
            </Button>
          ))}
        </div>
      </section>

      <section aria-labelledby="account-password" className={cardClasses}>
        <PanelHeader id="account-password" icon={KeyRound} title={ptPT.auth.fields.password} />
        <Button
          variant="secondary"
          loading={sending}
          loadingText={copy.saving}
          onClick={handlePasswordEmail}
          className="h-auto min-h-11 self-start py-2 whitespace-normal"
        >
          {copy.passwordEmail}
        </Button>
      </section>

      <section aria-labelledby="account-delete" className={cardClasses}>
        <PanelHeader id="account-delete" icon={Trash2} tone="muted" title={copy.deleteTitle} />
        <p className="type-body text-muted">{copy.deleteWarning}</p>
        <Dialog onOpenChange={() => setConfirmation("")}>
          <DialogTrigger asChild>
            <Button variant="danger" className="self-start">
              {copy.deleteTitle}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>{copy.deleteTitle}</DialogTitle>
            <DialogDescription>{copy.deleteWarning}</DialogDescription>
            <form onSubmit={handleDelete} className="flex flex-col gap-4">
              <Field label={copy.deleteConfirm}>
                <Input
                  value={confirmation}
                  autoComplete="off"
                  placeholder={DELETE_CONFIRMATION}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
              </Field>
              <Button
                type="submit"
                variant="danger"
                loading={deleting}
                loadingText={copy.saving}
                disabled={!isDeleteConfirmed(confirmation)}
              >
                {copy.deleteTitle}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
