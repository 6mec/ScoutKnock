"use client";

import { Check, Link2, Monitor, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { saveDemo, setDemoSent } from "@/lib/demos/actions";
import {
  DEMO_COLORS,
  DEMO_TEMPLATES,
  MAX_ADDRESS,
  MAX_COMPANY_NAME,
  MAX_HEADLINE,
  MAX_INTRO,
  MAX_LOCALITY,
  MAX_NICHE,
  MAX_PHONE,
  parseDemoContent,
  type DemoColorName,
  type DemoContent,
  type OwnDemo,
} from "@/lib/demos/rules";
import { cn } from "@/lib/utils";
import { DemoView } from "./demo-view";

const { demos: copy } = ptPT;
const COLOR_NAMES = Object.keys(DEMO_COLORS) as DemoColorName[];
const optionClasses =
  "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent";

export function DemoEditor({
  demo,
  expiresLabel,
}: {
  demo: OwnDemo;
  expiresLabel: string;
}) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const [sending, startSending] = useTransition();
  const [view, setView] = useState<"desktop" | "mobile">("desktop");
  const [content, setContent] = useState<DemoContent>({
    companyName: demo.company_name,
    niche: demo.niche,
    locality: demo.locality,
    address: demo.address,
    phone: demo.phone,
    template: demo.template,
    accentColor: demo.accent_color,
    headline: demo.headline,
    intro: demo.intro,
  });

  const valid = parseDemoContent(content) !== null;
  const update = (change: Partial<DemoContent>) =>
    setContent((current) => ({ ...current, ...change }));

  function handleSave(event: FormEvent) {
    event.preventDefault();
    startSaving(async () => {
      const { ok } = await saveDemo(demo.id, content);
      if (ok) toast.success(copy.editor.saved);
      else toast.error(copy.errors.generic);
      router.refresh();
    });
  }

  function handleSent() {
    startSending(async () => {
      const { ok } = await setDemoSent(demo.id, demo.status === "draft");
      if (!ok) toast.error(copy.errors.generic);
      router.refresh();
    });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/demo/${demo.slug}`,
      );
      toast.success(copy.editor.linkCopied);
    } catch {
      toast.error(copy.errors.generic);
    }
  }

  return (
    <div className="grid flex-1 lg:grid-cols-[380px_minmax(0,1fr)]">
      <form
        onSubmit={handleSave}
        className="flex flex-col gap-5 border-border bg-background p-4 lg:border-r lg:p-8"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={demo.status === "sent" ? "accent" : "outline"}>
            {copy.status[demo.status]}
          </Badge>
          <Badge variant="amber">{copy.unofficial}</Badge>
        </div>
        <p className="text-14 text-muted">{expiresLabel}</p>

        <Field label={copy.editor.companyName}>
          <Input
            value={content.companyName}
            maxLength={MAX_COMPANY_NAME}
            onChange={(event) => update({ companyName: event.target.value })}
            required
          />
        </Field>
        <Field label={copy.editor.niche}>
          <Input
            value={content.niche}
            maxLength={MAX_NICHE}
            onChange={(event) => update({ niche: event.target.value })}
          />
        </Field>
        <Field label={copy.editor.locality}>
          <Input
            value={content.locality}
            maxLength={MAX_LOCALITY}
            onChange={(event) => update({ locality: event.target.value })}
          />
        </Field>
        <Field label={copy.editor.address}>
          <Input
            value={content.address}
            maxLength={MAX_ADDRESS}
            onChange={(event) => update({ address: event.target.value })}
          />
        </Field>
        <Field label={copy.editor.phone}>
          <Input
            type="tel"
            value={content.phone ?? ""}
            maxLength={MAX_PHONE}
            onChange={(event) => update({ phone: event.target.value })}
          />
        </Field>
        <Field label={copy.editor.headline}>
          <Input
            value={content.headline}
            maxLength={MAX_HEADLINE}
            onChange={(event) => update({ headline: event.target.value })}
            required
          />
        </Field>
        <Field label={copy.editor.intro}>
          <Textarea
            value={content.intro}
            maxLength={MAX_INTRO}
            onChange={(event) => update({ intro: event.target.value })}
            required
          />
        </Field>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-13 text-muted">{copy.editor.template}</legend>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_TEMPLATES.map((id) => (
              <label
                key={id}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-border-input px-2 text-14",
                  optionClasses,
                  content.template === id && "border-accent text-accent",
                )}
              >
                <input
                  type="radio"
                  name="template"
                  value={id}
                  checked={content.template === id}
                  onChange={() => update({ template: id })}
                  className="sr-only"
                />
                {copy.editor.templates[id]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-13 text-muted">{copy.editor.color}</legend>
          <div className="flex flex-wrap gap-2">
            {COLOR_NAMES.map((name) => {
              const color = DEMO_COLORS[name];
              const checked = content.accentColor === color;
              return (
                <label
                  key={name}
                  title={copy.editor.colors[name]}
                  style={{ backgroundColor: color }}
                  className={cn(
                    "flex size-11 cursor-pointer items-center justify-center rounded-pill border-2 border-transparent text-[#FFFFFF]",
                    optionClasses,
                    checked && "border-foreground",
                  )}
                >
                  <input
                    type="radio"
                    name="color"
                    value={color}
                    checked={checked}
                    onChange={() => update({ accentColor: color })}
                    aria-label={copy.editor.colors[name]}
                    className="sr-only"
                  />
                  {checked && <Check aria-hidden="true" size={18} strokeWidth={2} />}
                </label>
              );
            })}
          </div>
        </fieldset>

        <Button
          type="submit"
          size="lg"
          loading={saving}
          loadingText={copy.editor.saving}
          disabled={!valid}
          className="w-full"
        >
          {copy.editor.save}
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={copyLink} className="flex-1">
            <Link2 aria-hidden="true" size={16} strokeWidth={1.75} />
            {copy.editor.copyLink}
          </Button>
          <Button
            variant="secondary"
            onClick={handleSent}
            loading={sending}
            loadingText={copy.editor.saving}
            className="flex-1"
          >
            {demo.status === "draft" ? copy.editor.markSent : copy.editor.markDraft}
          </Button>
        </div>
        <p className="text-13 text-muted">{copy.editor.linkHint}</p>
      </form>

      <section
        aria-label={copy.editor.preview}
        className="flex min-w-0 flex-col gap-4 p-4 lg:p-8"
      >
        <div
          role="group"
          aria-label={ptPT.landing.show.window.viewLabel}
          className="flex gap-1 self-end"
        >
          {(
            [
              ["desktop", ptPT.landing.show.window.desktop, Monitor],
              ["mobile", ptPT.landing.show.window.mobile, Smartphone],
            ] as const
          ).map(([id, label, Icon]) => (
            <Button
              key={id}
              size="sm"
              variant={view === id ? "secondary" : "ghost"}
              aria-pressed={view === id}
              onClick={() => setView(id)}
            >
              <Icon aria-hidden="true" size={16} strokeWidth={1.75} />
              {label}
            </Button>
          ))}
        </div>
        <div
          className={cn(
            "mx-auto w-full overflow-hidden rounded-lg border border-border transition-[max-width] duration-(--duration-base) ease-out",
            view === "mobile" ? "max-w-97.5" : "max-w-full",
          )}
        >
          <DemoView
            preview
            demo={{
              ...demo,
              company_name: content.companyName,
              niche: content.niche,
              locality: content.locality,
              address: content.address,
              phone: content.phone?.trim() || null,
              template: content.template,
              accent_color: content.accentColor,
              headline: content.headline,
              intro: content.intro,
            }}
          />
        </div>
      </section>
    </div>
  );
}
