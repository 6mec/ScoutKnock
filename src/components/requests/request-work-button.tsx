"use client";

import { AppWindow, CalendarClock, ClipboardList, Globe, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { createWorkRequest } from "@/lib/requests/actions";
import { MAX_BRIEF, REQUEST_KINDS, type RequestKind } from "@/lib/requests/rules";
import { cn } from "@/lib/utils";

const { requests: copy } = ptPT;
const ICONS: Record<RequestKind, LucideIcon> = { site: Globe, site_booking: CalendarClock, app: AppWindow };

export function RequestWorkButton({
  companyName,
  contactId = null,
  demoId = null,
  defaultKind = "site",
  variant = "secondary",
  size = "md",
}: {
  companyName: string;
  contactId?: string | null;
  demoId?: string | null;
  defaultKind?: RequestKind;
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<RequestKind>(defaultKind);
  const [brief, setBrief] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createWorkRequest({ kind, brief, companyName, contactId, demoId });
      if (result.ok) {
        toast.success(copy.saved);
        setOpen(false);
        setBrief("");
        router.refresh();
      } else {
        setError(result.invalid ? copy.errors.invalid : copy.errors.generic);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} data-testid="request-work-open">
          <ClipboardList aria-hidden="true" size={16} />
          {copy.open}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogTitle>{copy.dialogTitle(companyName)}</DialogTitle>
        <DialogDescription>{copy.dialogBody}</DialogDescription>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-14 font-medium">{copy.kindLabel}</legend>
            {REQUEST_KINDS.map((value) => {
              const Icon = ICONS[value];
              const checked = kind === value;
              return (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-accent",
                    checked && "border-accent/60 bg-accent-soft",
                  )}
                >
                  <input
                    type="radio"
                    name="request-kind"
                    value={value}
                    checked={checked}
                    onChange={() => setKind(value)}
                    className="sr-only"
                  />
                  <Icon aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-accent" />
                  <span className="flex flex-col">
                    <span className="text-14 font-semibold">{copy.kinds[value]}</span>
                    <span className="text-13 text-muted">{copy.kindHelp[value]}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>
          {!demoId && kind !== "app" && <p className="text-13 text-amber">{copy.noDemo}</p>}
          {demoId && <p className="text-13 text-muted">{copy.linkedDemo}</p>}
          <Field label={copy.brief} help={copy.briefHelp} error={error}>
            <Textarea
              data-testid="request-brief"
              value={brief}
              maxLength={MAX_BRIEF}
              required
              rows={6}
              placeholder={copy.briefPlaceholder[kind]}
              onChange={(event) => setBrief(event.target.value)}
            />
          </Field>
          <Button type="submit" loading={pending} loadingText={copy.saving} disabled={!brief.trim()} className="self-start">
            {copy.submit}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
