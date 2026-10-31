"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import {
  MAX_MESSAGE_LENGTH,
  MESSAGE_TONES,
  emailUrl,
  whatsappUrl,
  type MessageErrorCode,
  type MessageEvent,
  type MessageSource,
  type MessageTone,
} from "@/lib/messages/rules";
import { readNdjson } from "@/lib/read-ndjson";

const { messages: copy } = ptPT;

type Status = "writing" | "ready" | "error";

const ERROR_BY_STATUS: Record<number, MessageErrorCode> = {
  404: "notFound",
  409: "lookupLimit",
  429: "limit",
};

export function GenerateMessageButton({
  source,
  companyName,
  phone,
  variant = "primary",
}: {
  source: MessageSource;
  companyName: string;
  phone?: string | null;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();
  const controller = useRef<AbortController | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("writing");
  const [text, setText] = useState("");
  const [isSample, setIsSample] = useState(false);
  const [errorCode, setErrorCode] = useState<MessageErrorCode>("provider");
  const [tone, setTone] = useState<MessageTone>("normal");
  const [edited, setEdited] = useState(false);
  const [pendingTone, setPendingTone] = useState<MessageTone | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  async function generate(nextTone: MessageTone) {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;

    setTone(nextTone);
    setStatus("writing");
    setText("");
    setEdited(false);
    setPendingTone(null);

    function fail(code: MessageErrorCode) {
      setErrorCode(code);
      setStatus("error");
    }

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, tone: nextTone }),
        signal: current.signal,
      });

      if (response.status === 401) {
        router.push("/entrar");
        return;
      }
      if (!response.ok || !response.body) {
        fail(ERROR_BY_STATUS[response.status] ?? "provider");
        return;
      }

      let finished = false;
      await readNdjson<MessageEvent>(response.body, (event) => {
        if (current.signal.aborted) return;
        if (event.type === "start") setIsSample(event.isSample);
        if (event.type === "text") setText((value) => value + event.text);
        if (event.type === "done") {
          finished = true;
          setStatus("ready");
        }
        if (event.type === "error") {
          finished = true;
          fail(event.code);
        }
      });

      // A ligação fechou sem o servidor dizer que terminou.
      if (!finished && !current.signal.aborted) fail("provider");
    } catch {
      if (current.signal.aborted) return;
      fail(navigator.onLine ? "provider" : "offline");
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) controller.current?.abort();
  }

  function requestTone(next: MessageTone) {
    if (edited) setPendingTone(next);
    else generate(next);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(copy.copied);
    } catch {
      toast.error(copy.copyFailed);
    }
  }

  const hasText = text.trim().length > 0;

  return (
    <>
      <Button
        variant={variant}
        onClick={() => {
          setOpen(true);
          generate("normal");
        }}
      >
        {copy.generate}
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent aria-describedby={undefined} className="max-w-lg">
          <DialogTitle>{copy.title(companyName)}</DialogTitle>
          {isSample && (
            <div className="flex flex-col items-start gap-2">
              <Badge variant="amber">{copy.sampleBadge}</Badge>
              <p className="text-14 text-muted">{copy.sampleNotice}</p>
            </div>
          )}
          <p role="status" className="text-14 text-muted">
            {status === "writing" && copy.writing}
            {status === "ready" && copy.ready}
          </p>
          {status === "writing" && (
            <p
              aria-hidden="true"
              data-testid="message-stream"
              className="min-h-28 rounded-md border border-border-input bg-surface px-3 py-3 leading-[1.6] whitespace-pre-wrap"
            >
              {text}
              <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-accent motion-safe:animate-pulse" />
            </p>
          )}
          {status === "ready" && (
            <Field label={copy.label}>
              <Textarea
                rows={8}
                value={text}
                maxLength={MAX_MESSAGE_LENGTH}
                onChange={(event) => {
                  setText(event.target.value);
                  setEdited(true);
                }}
              />
            </Field>
          )}
          {status === "error" && (
            <div
              role="alert"
              className="flex flex-col items-start gap-3 rounded-md border border-danger p-4"
            >
              <p>{copy.errors[errorCode]}</p>
              {errorCode !== "limit" && errorCode !== "lookupLimit" && errorCode !== "notFound" && (
                <Button variant="secondary" onClick={() => generate(tone)}>
                  {copy.retry}
                </Button>
              )}
            </div>
          )}
          <p className="rounded-md border border-border p-3 text-14 text-muted">
            {copy.warning}
          </p>
          {status === "ready" && hasText && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCopy}>{copy.copy}</Button>
              <Button variant="secondary" asChild>
                <a
                  href={whatsappUrl(text, phone)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {copy.whatsapp}
                </a>
              </Button>
              <Button variant="secondary" asChild>
                <a href={emailUrl(text, copy.emailSubject(companyName))}>
                  {copy.email}
                </a>
              </Button>
            </div>
          )}
          {status === "ready" &&
            (pendingTone ? (
              <div className="flex flex-col gap-3 rounded-md border border-border-strong p-4">
                <p>{copy.replaceWarning}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => generate(pendingTone)}
                  >
                    {copy.replaceConfirm}
                  </Button>
                  <Button variant="ghost" onClick={() => setPendingTone(null)}>
                    {copy.replaceCancel}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                role="group"
                aria-labelledby="message-new-version"
                className="flex flex-col gap-2"
              >
                <p id="message-new-version" className="text-13 text-muted">
                  {copy.newVersion}
                </p>
                <div className="flex flex-wrap gap-2">
                  {MESSAGE_TONES.map((value) => (
                    <Button
                      key={value}
                      variant="ghost"
                      size="sm"
                      onClick={() => requestTone(value)}
                    >
                      {copy.tones[value]}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
        </DialogContent>
      </Dialog>
    </>
  );
}
