"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { getFollowUp } from "@/lib/contacts/actions";
import { followUpState, type Contact } from "@/lib/contacts/rules";
import { MAX_MESSAGE_LENGTH, emailUrl, whatsappUrl } from "@/lib/messages/rules";

const { followUp: copy } = ptPT.contacts;
const { messages } = ptPT;

export function FollowUpButton({
  contact,
  phone,
}: {
  contact: Contact;
  phone?: string | null;
}) {
  const [now] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [generated, setGenerated] = useState(Boolean(contact.follow_up_at));
  const buttonRef = useRef<HTMLButtonElement>(null);

  const state = generated
    ? ({ kind: "generated" } as const)
    : followUpState(contact, now);

  if (state.kind === "none") return null;
  if (state.kind === "wait") {
    return <p className="text-14 text-muted">{copy.availableIn(state.days)}</p>;
  }

  function handleClick() {
    startTransition(async () => {
      const result = await getFollowUp(contact.id);
      if (!result.ok) {
        toast.error(copy.error);
        return;
      }
      setText(result.text);
      setGenerated(true);
      setOpen(true);
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(messages.copied);
    } catch {
      toast.error(messages.copyFailed);
    }
  }

  return (
    <>
      <Button
        ref={buttonRef}
        variant="secondary"
        className="self-start"
        loading={pending}
        loadingText={copy.pending}
        onClick={handleClick}
      >
        {state.kind === "generated" ? copy.view : copy.generate}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="max-w-lg"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            buttonRef.current?.focus();
          }}
        >
          <DialogTitle>{copy.title(contact.label)}</DialogTitle>
          <Field label={copy.label}>
            <Textarea
              rows={6}
              value={text}
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={(event) => setText(event.target.value)}
            />
          </Field>
          <p className="rounded-md border border-border p-3 text-14 text-muted">
            {messages.warning} {copy.once}
          </p>
          {text.trim() && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCopy}>{messages.copy}</Button>
              <Button variant="secondary" asChild>
                <a
                  href={whatsappUrl(text, phone)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {messages.whatsapp}
                </a>
              </Button>
              <Button variant="secondary" asChild>
                <a href={emailUrl(text, messages.emailSubject(contact.label))}>
                  {messages.email}
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
