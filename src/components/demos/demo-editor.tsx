"use client";

import { Check, Link2, Monitor, Plus, Smartphone, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { PanelHeader } from "@/components/ui/panel-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { generateDemoCopy, saveDemo, setDemoNicheExample, setDemoSent } from "@/lib/demos/actions";
import { MAX_BOOKING_HOURS } from "@/lib/demos/booking";
import { FONT_FAMILIES, FONT_LABELS } from "@/lib/demos/fonts";
import { IDENTITIES, IDENTITY_KEYS, identityOf, type IdentityKey } from "@/lib/demos/identities";
import { isLive } from "@/lib/demos/official-rules";
import {
  DEMO_COLORS,
  DEMO_TEMPLATES,
  MAX_ABOUT,
  MAX_ADDRESS,
  MAX_COMPANY_NAME,
  MAX_CTA,
  MAX_HEADLINE,
  MAX_HIGHLIGHTS,
  MAX_INTRO,
  MAX_ITEM_DESCRIPTION,
  MAX_ITEM_TITLE,
  MAX_LOCALITY,
  MAX_NICHE,
  MAX_PHONE,
  MAX_SERVICES,
  MAX_SUBHEADLINE,
  parseDemoContent,
  type DemoContent,
  type DemoItem,
  type OwnDemo,
} from "@/lib/demos/rules";
import { cn } from "@/lib/utils";
import { DemoView } from "./demo-view";
import { RequestWorkButton } from "@/components/requests/request-work-button";
import { OfficialSiteSection, type Publishing } from "./official-site-section";

const { demos: copy } = ptPT;
const editor = copy.editor;
const optionClasses =
  "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent";

function Numbered({ label, n }: { label: string; n: number }) {
  return (
    <>
      {label}
      <span className="sr-only">{editor.itemNumber(n)}</span>
    </>
  );
}

// Serviços ou destaques: linhas com título e descrição, com acrescentar e remover.
function ItemsEditor({
  legend,
  help,
  items,
  max,
  titleLabel,
  descriptionLabel,
  addLabel,
  onChange,
}: {
  legend: string;
  help?: string;
  items: DemoItem[];
  max: number;
  titleLabel: string;
  descriptionLabel: string;
  addLabel: string;
  onChange: (items: DemoItem[]) => void;
}) {
  const set = (index: number, change: Partial<DemoItem>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...change } : item)));

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-14 font-semibold">{legend}</legend>
      {help && <p className="text-13 text-muted">{help}</p>}
      {items.map((item, index) => (
        <div key={index} className="panel-row flex flex-col gap-3 p-3">
          <div className="flex items-end gap-2">
            <Field label={<Numbered label={titleLabel} n={index + 1} />} className="flex-1">
              <Input
                value={item.title}
                maxLength={MAX_ITEM_TITLE}
                onChange={(event) => set(index, { title: event.target.value })}
              />
            </Field>
            <Button
              variant="ghost"
              aria-label={editor.remove(titleLabel.toLowerCase(), index + 1)}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="mb-0.5 px-3"
            >
              <Trash2 aria-hidden="true" size={16} strokeWidth={1.75} />
            </Button>
          </div>
          <Field label={<Numbered label={descriptionLabel} n={index + 1} />}>
            <Input
              value={item.description}
              maxLength={MAX_ITEM_DESCRIPTION}
              onChange={(event) => set(index, { description: event.target.value })}
            />
          </Field>
        </div>
      ))}
      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        disabled={items.length >= max}
        onClick={() => onChange([...items, { title: "", description: "" }])}
      >
        <Plus aria-hidden="true" size={16} strokeWidth={1.75} />
        {addLabel}
      </Button>
    </fieldset>
  );
}

export function DemoEditor({
  demo,
  expiresLabel,
  publishing,
  aiEnabled = false,
}: {
  demo: OwnDemo;
  expiresLabel: string | null;
  publishing: Publishing;
  aiEnabled?: boolean;
}) {
  const official = isLive(demo.official_sites);
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const [sending, startSending] = useTransition();
  const [writing, startWriting] = useTransition();
  const [nicheExample, setNicheExample] = useState(Boolean(demo.niche_example));
  const [markingExample, startMarkingExample] = useTransition();
  const [view, setView] = useState<"desktop" | "mobile">("desktop");
  const [aiLeft, setAiLeft] = useState(3 - (demo.ai_generations ?? 0));
  const startIdentity = identityOf(demo.niche_style, demo.niche);
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
    nicheStyle: startIdentity.key,
    subheadline: demo.subheadline ?? startIdentity.copy.subheadline,
    ctaLabel: demo.cta_label ?? startIdentity.copy.cta,
    about: demo.about ?? startIdentity.copy.about,
    services: demo.services?.length ? demo.services : startIdentity.copy.services,
    highlights: demo.highlights?.length ? demo.highlights : startIdentity.copy.highlights,
    bookingEnabled: demo.booking_enabled ?? false,
    bookingHours: demo.booking_hours ?? "",
  });

  const valid = parseDemoContent(content) !== null;
  const update = (change: Partial<DemoContent>) =>
    setContent((current) => ({ ...current, ...change }));
  const identity = IDENTITIES[content.nicheStyle];
  const accents = [...new Set([identity.palette.accent, ...Object.values(DEMO_COLORS)])];

  function chooseIdentity(key: IdentityKey) {
    const next = IDENTITIES[key];
    // O estilo traz cores, letras e disposição; os textos ficam como estão.
    update({ nicheStyle: key, template: next.layout, accentColor: next.palette.accent });
  }

  function handleSave(event: FormEvent) {
    event.preventDefault();
    startSaving(async () => {
      const { ok } = await saveDemo(demo.id, content);
      if (ok) toast.success(editor.saved);
      else toast.error(copy.errors.generic);
      router.refresh();
    });
  }

  function handleWrite() {
    startWriting(async () => {
      const result = await generateDemoCopy(demo.id, {
        companyName: content.companyName,
        niche: content.niche,
        locality: content.locality,
        nicheStyle: content.nicheStyle,
      });
      if (!result.ok) {
        if (result.error === "limit") setAiLeft(0);
        toast.error(result.error === "limit" ? editor.write.limit : copy.errors.generic);
        return;
      }
      update(result.copy);
      if (result.remaining !== null) setAiLeft(result.remaining);
      toast.success(result.isSample ? editor.write.sampleDone : editor.write.done);
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
        official && publishing.url
          ? publishing.url
          : `${window.location.origin}/demo/${demo.slug}`,
      );
      toast.success(editor.linkCopied);
    } catch {
      toast.error(copy.errors.generic);
    }
  }

  const aiAvailable = aiEnabled && aiLeft > 0;

  return (
    <div className="grid flex-1 lg:grid-cols-[440px_minmax(0,1fr)]">
      <div className="flex flex-col border-border bg-background lg:border-r">
        <form onSubmit={handleSave} className="flex flex-col gap-5 p-4 lg:p-6">
          <div className="flex flex-wrap items-center gap-2">
            {official ? (
              <Badge variant="accent">{copy.official.badge}</Badge>
            ) : (
              <>
                <Badge variant={demo.status === "sent" ? "accent" : "outline"}>
                  {copy.status[demo.status]}
                </Badge>
                <Badge variant="amber">{copy.unofficial}</Badge>
              </>
            )}
          </div>
          {expiresLabel && <p className="text-14 text-muted">{expiresLabel}</p>}

          <section aria-labelledby="demo-write" className="panel panel-glow flex flex-col gap-3 p-4">
            <PanelHeader
              id="demo-write"
              icon={Sparkles}
              title={editor.write.title}
              description={aiEnabled ? editor.write.aiHelp : undefined}
              as="h3"
            />
            <Button
              variant={aiAvailable ? "primary" : "secondary"}
              loading={writing}
              loadingText={editor.write.writing}
              disabled={aiEnabled && aiLeft <= 0}
              onClick={handleWrite}
            >
              <Sparkles aria-hidden="true" size={16} strokeWidth={1.75} />
              {aiEnabled ? editor.write.aiButton : editor.write.sampleButton}
            </Button>
            <p className="text-13 text-muted" data-testid="demo-ai-status">
              {aiEnabled
                ? aiLeft > 0
                  ? editor.write.aiRemaining(aiLeft)
                  : editor.write.aiNone
                : editor.write.aiOff}
            </p>
          </section>

          <Tabs defaultValue="visual">
            <TabsList className="overflow-x-auto">
              <TabsTrigger value="visual">{editor.tabs.visual}</TabsTrigger>
              <TabsTrigger value="texts">{editor.tabs.texts}</TabsTrigger>
              <TabsTrigger value="services">{editor.tabs.services}</TabsTrigger>
              <TabsTrigger value="company">{editor.tabs.company}</TabsTrigger>
            </TabsList>

            <TabsContent value="visual" className="flex flex-col gap-5 pt-5">
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-14 font-semibold">{editor.style}</legend>
                <p className="mb-1 text-13 text-muted">{editor.styleHelp}</p>
                <div className="grid grid-cols-2 gap-2">
                  {IDENTITY_KEYS.map((key) => {
                    const item = IDENTITIES[key];
                    const checked = content.nicheStyle === key;
                    return (
                      <label
                        key={key}
                        className={cn(
                          "flex cursor-pointer flex-col gap-2 rounded-md border border-border p-2.5 transition-colors duration-(--duration-fast)",
                          optionClasses,
                          checked ? "border-accent bg-accent-soft" : "hovered:border-border-strong",
                        )}
                      >
                        <input
                          type="radio"
                          name="niche-style"
                          value={key}
                          checked={checked}
                          onChange={() => chooseIdentity(key)}
                          className="sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className="flex h-12 items-end justify-between rounded-sm px-2 pb-1.5"
                          style={{ backgroundColor: item.palette.heroBackground, color: item.palette.heroText }}
                        >
                          <span style={{ fontFamily: FONT_FAMILIES[item.fonts.display] }} className="text-20 leading-none font-bold">
                            Aa
                          </span>
                          <span className="size-4 rounded-full" style={{ backgroundColor: item.palette.accent }} />
                        </span>
                        <span className="flex items-center justify-between gap-1 text-13 font-medium">
                          {item.label}
                          {checked && <Check aria-hidden="true" size={14} strokeWidth={2.2} className="text-accent" />}
                        </span>
                        <span className="text-12 text-muted">
                          {editor.styleFonts(FONT_LABELS[item.fonts.display], FONT_LABELS[item.fonts.body])}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-14 font-semibold">{editor.layout}</legend>
                <div className="grid grid-cols-3 gap-2">
                  {DEMO_TEMPLATES.map((id) => (
                    <label
                      key={id}
                      className={cn(
                        "flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-md border border-border-input px-2 py-2 text-center text-14",
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
                      {editor.templates[id]}
                      <span className="text-12 text-muted">{editor.templateHelp[id]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-14 font-semibold">{editor.color}</legend>
                <div className="flex flex-wrap gap-2">
                  {accents.map((color) => {
                    const checked = content.accentColor === color;
                    return (
                      <label
                        key={color}
                        title={color}
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
                          aria-label={`${editor.color} ${color}`}
                          className="sr-only"
                        />
                        {checked && <Check aria-hidden="true" size={18} strokeWidth={2} className="mix-blend-difference" />}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </TabsContent>

            <TabsContent value="texts" className="flex flex-col gap-4 pt-5">
              <Field label={editor.headline}>
                <Input
                  value={content.headline}
                  maxLength={MAX_HEADLINE}
                  onChange={(event) => update({ headline: event.target.value })}
                  required
                />
              </Field>
              <Field label={editor.subheadline}>
                <Textarea
                  rows={2}
                  value={content.subheadline}
                  maxLength={MAX_SUBHEADLINE}
                  onChange={(event) => update({ subheadline: event.target.value })}
                />
              </Field>
              <Field label={editor.ctaLabel}>
                <Input
                  value={content.ctaLabel}
                  maxLength={MAX_CTA}
                  onChange={(event) => update({ ctaLabel: event.target.value })}
                />
              </Field>
              <Field label={editor.intro}>
                <Textarea
                  value={content.intro}
                  maxLength={MAX_INTRO}
                  onChange={(event) => update({ intro: event.target.value })}
                  required
                />
              </Field>
              <Field label={editor.about}>
                <Textarea
                  value={content.about}
                  maxLength={MAX_ABOUT}
                  onChange={(event) => update({ about: event.target.value })}
                />
              </Field>
            </TabsContent>

            <TabsContent value="services" className="flex flex-col gap-6 pt-5">
              <ItemsEditor
                legend={editor.services}
                help={editor.servicesHelp}
                items={content.services}
                max={MAX_SERVICES}
                titleLabel={editor.serviceTitle}
                descriptionLabel={editor.serviceDescription}
                addLabel={editor.addService}
                onChange={(services) => update({ services })}
              />
              <ItemsEditor
                legend={editor.highlights}
                items={content.highlights}
                max={MAX_HIGHLIGHTS}
                titleLabel={editor.highlightTitle}
                descriptionLabel={editor.highlightDescription}
                addLabel={editor.addHighlight}
                onChange={(highlights) => update({ highlights })}
              />
              <div className="flex flex-col gap-3 rounded-md border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <label htmlFor="demo-booking" className="flex flex-col gap-1">
                    <span className="text-14 font-semibold">{copy.booking.editor.enabled}</span>
                    <span className="text-13 text-muted">{copy.booking.editor.enabledHelp}</span>
                  </label>
                  <Switch
                    id="demo-booking"
                    data-testid="booking-toggle"
                    checked={content.bookingEnabled}
                    onCheckedChange={(bookingEnabled) => update({ bookingEnabled })}
                  />
                </div>
                {content.bookingEnabled && (
                  <Field label={copy.booking.editor.hours} help={copy.booking.editor.hoursHelp}>
                    <Input
                      data-testid="booking-hours"
                      value={content.bookingHours}
                      maxLength={MAX_BOOKING_HOURS}
                      placeholder={copy.booking.editor.hoursPlaceholder}
                      onChange={(event) => update({ bookingHours: event.target.value })}
                    />
                  </Field>
                )}
              </div>
            </TabsContent>

            <TabsContent value="company" className="flex flex-col gap-4 pt-5">
              <Field label={editor.companyName}>
                <Input
                  value={content.companyName}
                  maxLength={MAX_COMPANY_NAME}
                  onChange={(event) => update({ companyName: event.target.value })}
                  required
                />
              </Field>
              <Field label={editor.niche}>
                <Input
                  value={content.niche}
                  maxLength={MAX_NICHE}
                  onChange={(event) => update({ niche: event.target.value })}
                />
              </Field>
              <Field label={editor.locality}>
                <Input
                  value={content.locality}
                  maxLength={MAX_LOCALITY}
                  onChange={(event) => update({ locality: event.target.value })}
                />
              </Field>
              <Field label={editor.address}>
                <Input
                  value={content.address}
                  maxLength={MAX_ADDRESS}
                  onChange={(event) => update({ address: event.target.value })}
                />
              </Field>
              <Field label={editor.phone}>
                <Input
                  type="tel"
                  value={content.phone ?? ""}
                  maxLength={MAX_PHONE}
                  onChange={(event) => update({ phone: event.target.value })}
                />
              </Field>
            </TabsContent>
          </Tabs>

          <Callout>{editor.write.review}</Callout>
          <Button
            type="submit"
            size="lg"
            loading={saving}
            loadingText={editor.saving}
            disabled={!valid}
            className="w-full"
          >
            {editor.save}
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={copyLink} className="flex-1">
              <Link2 aria-hidden="true" size={16} strokeWidth={1.75} />
              {editor.copyLink}
            </Button>
            {!official && (
              <Button
                variant="secondary"
                onClick={handleSent}
                loading={sending}
                loadingText={editor.saving}
                className="flex-1"
              >
                {demo.status === "draft" ? editor.markSent : editor.markDraft}
              </Button>
            )}
          </div>
          <p className="text-13 text-muted">{editor.linkHint}</p>
        </form>
        {/* Fora do formulário: o envio do pedido não pode guardar a demo. */}
        <div className="flex flex-col gap-2 border-t border-border p-4 lg:px-8">
          <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3" data-testid="demo-niche-example">
            <label htmlFor="demo-niche-example" className="flex flex-col gap-1">
              <span className="text-14 font-semibold">{editor.nicheExample(demo.niche)}</span>
              <span className="text-13 text-muted">{editor.nicheExampleHelp}</span>
            </label>
            <Switch
              id="demo-niche-example"
              checked={nicheExample}
              disabled={markingExample}
              onCheckedChange={(value) =>
                startMarkingExample(async () => {
                  const { ok } = await setDemoNicheExample(demo.id, value);
                  if (ok) {
                    setNicheExample(value);
                    toast.success(value ? editor.nicheExampleOn : editor.nicheExampleOff);
                  } else {
                    toast.error(ptPT.demos.errors.generic);
                  }
                })
              }
            />
          </div>
          <RequestWorkButton
            companyName={content.companyName}
            demoId={demo.id}
            defaultKind={content.bookingEnabled ? "site_booking" : "site"}
          />
        </div>
        <OfficialSiteSection
          demoId={demo.id}
          companyName={demo.company_name}
          site={demo.official_sites}
          publishing={publishing}
        />
      </div>

      <section aria-label={editor.preview} className="flex min-w-0 flex-col gap-4 p-4 lg:p-6">
        <div role="group" aria-label={ptPT.landing.show.window.viewLabel} className="flex gap-1 self-end">
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
            "mx-auto w-full overflow-hidden rounded-lg border border-panel-border shadow-float transition-[max-width] duration-(--duration-base) ease-out",
            view === "mobile" ? "max-w-97.5" : "max-w-full",
          )}
        >
          <DemoView
            preview
            official={official}
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
              niche_style: content.nicheStyle,
              subheadline: content.subheadline,
              cta_label: content.ctaLabel,
              about: content.about,
              services: content.services.filter((item) => item.title.trim()),
              highlights: content.highlights.filter((item) => item.title.trim()),
              booking_enabled: content.bookingEnabled,
              booking_hours: content.bookingHours.trim() || null,
            }}
          />
        </div>
      </section>
    </div>
  );
}
