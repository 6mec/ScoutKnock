"use client";

import {
  BriefcaseBusiness,
  Copy,
  ExternalLink,
  Footprints,
  Phone,
  Plus,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Field, Input, Textarea } from "@/components/ui/field";
import { PanelHeader } from "@/components/ui/panel-header";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { savePortfolio, slugAvailable } from "@/lib/portfolio/actions";
import {
  checkSlug,
  LIMITS,
  MAX_SERVICES,
  parsePortfolio,
  portfolioUrl,
  type PortfolioError,
  type PublicPortfolio,
} from "@/lib/portfolio/rules";
import { PortfolioView } from "./portfolio-view";
import { TestimonialsEditor, type TestimonialRow } from "./testimonials-editor";

const copy = ptPT.portfolio;

export type PortfolioFormValues = {
  slug: string;
  published: boolean;
  indexable: boolean;
  displayName: string;
  headline: string;
  about: string;
  city: string;
  whatsapp: string;
  email: string;
  services: { title: string; description: string }[];
  processSteps: { title: string; text: string }[];
  priceFrom: string;
};

function Numbered({ label, n }: { label: string; n: number }) {
  return (
    <>
      {label}
      <span className="sr-only">{copy.itemNumber(n)}</span>
    </>
  );
}

function Toggle({ id, title, help, checked, onChange }: { id: string; title: string; help: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="flex flex-col gap-1">
        <span className="text-14 font-semibold">{title}</span>
        <span className="text-13 text-muted">{help}</span>
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

const INDEX = [
  ["sec-basics", copy.sections.basics],
  ["sec-contact", copy.sections.contact],
  ["sec-services", copy.sections.services],
  ["sec-works", copy.worksTitle],
  ["sec-process", copy.processTitle],
  ["sec-publishing", copy.sections.publishing],
  ["sec-testimonials", copy.testimonials.title],
] as const;

export function PortfolioEditor({
  initial,
  savedSlug,
  savedPublished,
  siteUrl,
  homeSlug = null,
  worksCount,
  testimonials,
  projects,
  drafts = [],
}: {
  // Trabalhos em rascunho (a checklist pediu a opinião): só saem quando forem aprovados.
  drafts?: { id: string; company_name: string }[];
  initial: PortfolioFormValues;
  savedSlug: string | null;
  savedPublished: boolean;
  siteUrl: string;
  // O endereço que abre na raiz do domínio (HOME_PORTFOLIO_SLUG), se houver.
  homeSlug?: string | null;
  worksCount: number;
  testimonials: TestimonialRow[];
  projects: { id: string; company_name: string }[];
}) {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState({ slug: savedSlug, published: savedPublished });
  // O que está gravado, para a barra de guardar dizer se há alterações por guardar.
  const [savedForm, setSavedForm] = useState(initial);
  const dirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const [error, setError] = useState<PortfolioError | "taken" | "generic" | null>(null);
  const [confirmSlug, setConfirmSlug] = useState(false);
  const [availability, setAvailability] = useState<{ slug: string; available: boolean | null } | null>(null);
  const [saving, startSaving] = useTransition();
  const publicUrl = (slug: string) => portfolioUrl(slug, siteUrl, homeSlug);
  const slugState = checkSlug(form.slug, form.displayName);
  const slugChanged = Boolean(saved.slug) && slugState.slug !== saved.slug;

  // Vê se o endereço está livre, meio segundo depois de parar de escrever.
  useEffect(() => {
    if (!slugState.valid || slugState.slug === saved.slug) return;
    const candidate = slugState.slug;
    const timer = setTimeout(async () => {
      const { available } = await slugAvailable(candidate);
      setAvailability({ slug: candidate, available });
    }, 500);
    return () => clearTimeout(timer);
  }, [slugState.slug, slugState.valid, saved.slug]);

  function update(values: Partial<PortfolioFormValues>) {
    setForm((current) => ({ ...current, ...values }));
    setError(null);
    if ("slug" in values) setConfirmSlug(false);
  }

  // A pré-visualização usa as mesmas regras que o servidor.
  const parsed = parsePortfolio({ ...form, slug: slugState.slug });
  const preview: PublicPortfolio = {
    slug: slugState.slug || "previsualizacao",
    display_name: form.displayName.trim() || copy.displayName,
    headline: form.headline.trim() || null,
    about: form.about.trim() || null,
    city: form.city.trim() || null,
    whatsapp: parsed.ok ? parsed.portfolio.whatsapp : null,
    email: parsed.ok ? parsed.portfolio.email : null,
    services: parsed.ok ? parsed.portfolio.services : [],
    process_steps: parsed.ok ? parsed.portfolio.processSteps : [],
    price_from: form.priceFrom.trim() || null,
    projects: [],
    sites: [],
  };

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Mudar o endereço de uma página publicada parte o link antigo: pede um segundo "Guardar".
    if (saved.published && slugChanged && !confirmSlug) {
      setConfirmSlug(true);
      return;
    }
    startSaving(async () => {
      const result = await savePortfolio({ ...form, slug: slugState.slug });
      if (result.ok) {
        setSaved({ slug: slugState.slug, published: form.published });
        setSavedForm({ ...form, slug: slugState.slug });
        setForm((current) => ({ ...current, slug: slugState.slug }));
        setConfirmSlug(false);
        toast.success(copy.saved);
      } else {
        setError(result.error);
      }
    });
  }

  async function copyLink() {
    if (!saved.slug) return;
    try {
      await navigator.clipboard.writeText(publicUrl(saved.slug));
      toast.success(copy.copied);
    } catch {
      toast.error(copy.errors.generic);
    }
  }

  const check = copy.slugCheck;
  const slugNotes: string[] = [];
  if (form.slug.trim()) {
    if (slugState.warnings.includes("changed") && slugState.slug) slugNotes.push(check.changed(slugState.slug));
    if (slugState.warnings.includes("doubleHyphen")) slugNotes.push(check.doubleHyphen);
    if (slugState.warnings.includes("format")) slugNotes.push(check.format);
    if (slugState.warnings.includes("reserved")) slugNotes.push(check.reserved);
    if (slugState.suggestion) slugNotes.push(check.typo(slugState.suggestion));
  }
  const freshAvailability = availability?.slug === slugState.slug ? availability.available : undefined;
  const slugStatus =
    !slugState.valid || slugState.slug === saved.slug
      ? null
      : freshAvailability === undefined
        ? check.checking
        : freshAvailability === false
          ? check.taken
          : freshAvailability
            ? check.available
            : null;

  return (
    <div className="grid w-full gap-6 px-4 pt-4 pb-6 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:px-8">
      <div className="flex min-w-0 flex-col gap-4">
        <form onSubmit={handleSubmit} noValidate className="flex min-w-0 flex-col gap-4" data-testid="portfolio-form">
          <div className="flex flex-col gap-2">
            <Badge variant={saved.published ? "accent" : "outline"} className="self-start">
              {saved.published ? copy.published : copy.draft}
            </Badge>
            {saved.slug && saved.published && (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild variant="secondary" size="sm">
                  <a href={saved.slug === homeSlug ? "/" : `/p/${saved.slug}`} target="_blank" rel="noreferrer noopener">
                    <ExternalLink aria-hidden="true" size={14} strokeWidth={1.75} />
                    {copy.open}
                  </a>
                </Button>
                <Button variant="secondary" size="sm" onClick={copyLink}>
                  <Copy aria-hidden="true" size={14} strokeWidth={1.75} />
                  {copy.copy}
                </Button>
              </div>
            )}
          </div>

          {/* Índice: a página é longa, salta-se direto à secção. */}
          <nav aria-label={copy.sections.index} data-testid="pf-index">
            <ul className="flex flex-wrap gap-2">
              {INDEX.map(([id, label]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="focus-ring inline-flex min-h-9 items-center rounded-pill border border-border px-3 text-13 text-muted transition-colors hovered:text-foreground"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <section aria-labelledby="pf-basics" id="sec-basics" className="panel flex scroll-mt-24 flex-col gap-4 p-5">
            <PanelHeader id="pf-basics" icon={UserRound} title={copy.sections.basics} as="h3" />
            <Field label={copy.displayName} error={error === "displayName" ? copy.errors.displayName : undefined}>
              <Input value={form.displayName} maxLength={LIMITS.displayName} onChange={(event) => update({ displayName: event.target.value })} />
            </Field>
            <Field
              label={copy.slug}
              help={
                <span className="flex flex-col gap-1" data-testid="slug-help">
                  {slugState.valid && <span>{copy.slugHelp(publicUrl(slugState.slug))}</span>}
                  {slugNotes.map((note) => (
                    <span key={note} className="text-amber">
                      {note}
                    </span>
                  ))}
                  {slugStatus && (
                    <span className={freshAvailability === false ? "text-danger" : undefined} data-testid="slug-status">
                      {slugStatus}
                    </span>
                  )}
                </span>
              }
              error={error === "slug" ? copy.errors.slug : error === "taken" ? copy.errors.taken : undefined}
            >
              <Input
                name="slug"
                value={form.slug}
                maxLength={60}
                autoCapitalize="none"
                spellCheck={false}
                onChange={(event) => update({ slug: event.target.value })}
              />
            </Field>
            {slugState.suggestion && (
              <Button type="button" variant="ghost" size="sm" className="-mt-2 self-start" onClick={() => update({ slug: slugState.suggestion as string })}>
                {check.useSuggestion(slugState.suggestion)}
              </Button>
            )}
            <Field label={copy.headline}>
              <Input value={form.headline} maxLength={LIMITS.headline} placeholder={copy.headlinePlaceholder} onChange={(event) => update({ headline: event.target.value })} />
            </Field>
            <Field label={copy.about}>
              <Textarea value={form.about} maxLength={LIMITS.about} placeholder={copy.aboutPlaceholder} onChange={(event) => update({ about: event.target.value })} />
            </Field>
            <Field label={copy.city}>
              <Input value={form.city} maxLength={LIMITS.city} onChange={(event) => update({ city: event.target.value })} />
            </Field>
          </section>

          <section aria-labelledby="pf-contact" id="sec-contact" className="panel flex scroll-mt-24 flex-col gap-4 p-5">
            <PanelHeader id="pf-contact" icon={Phone} title={copy.sections.contact} as="h3" />
            <Field label={copy.whatsapp} help={copy.whatsappHelp} error={error === "whatsapp" ? copy.errors.whatsapp : undefined}>
              <Input type="tel" value={form.whatsapp} maxLength={LIMITS.whatsapp} onChange={(event) => update({ whatsapp: event.target.value })} />
            </Field>
            <Field label={copy.email} help={copy.emailHelp} error={error === "email" ? copy.errors.email : undefined}>
              <Input type="email" value={form.email} maxLength={LIMITS.email} onChange={(event) => update({ email: event.target.value })} />
            </Field>
          </section>

          <section aria-labelledby="pf-services" id="sec-services" className="panel flex scroll-mt-24 flex-col gap-4 p-5">
            <PanelHeader id="pf-services" icon={Wrench} title={copy.sections.services} as="h3" />
            {form.services.map((service, index) => (
              <div key={index} className="panel-row flex flex-col gap-3 p-3">
                <div className="flex items-end gap-2">
                  <Field label={<Numbered label={copy.serviceTitle} n={index + 1} />} className="flex-1">
                    <Input
                      value={service.title}
                      maxLength={LIMITS.itemTitle}
                      placeholder={copy.servicePlaceholder}
                      onChange={(event) => update({ services: form.services.map((s, i) => (i === index ? { ...s, title: event.target.value } : s)) })}
                    />
                  </Field>
                  <Button
                    variant="ghost"
                    aria-label={copy.remove(copy.serviceTitle.toLowerCase(), index + 1)}
                    onClick={() => update({ services: form.services.filter((_, i) => i !== index) })}
                    className="mb-0.5 px-3"
                  >
                    <Trash2 aria-hidden="true" size={16} strokeWidth={1.75} />
                  </Button>
                </div>
                <Field label={<Numbered label={copy.serviceLine} n={index + 1} />}>
                  <Input
                    value={service.description}
                    maxLength={LIMITS.serviceLine}
                    placeholder={copy.serviceLinePlaceholder}
                    onChange={(event) => update({ services: form.services.map((s, i) => (i === index ? { ...s, description: event.target.value } : s)) })}
                  />
                </Field>
              </div>
            ))}
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              disabled={form.services.length >= MAX_SERVICES}
              onClick={() => update({ services: [...form.services, { title: "", description: "" }] })}
            >
              <Plus aria-hidden="true" size={16} strokeWidth={1.75} />
              {copy.addService}
            </Button>
          </section>

          <section aria-labelledby="pf-works" id="sec-works" className="panel flex scroll-mt-24 flex-col gap-3 p-5" data-testid="pf-works">
            <PanelHeader id="pf-works" icon={BriefcaseBusiness} title={copy.worksTitle} as="h3" />
            <p className="text-14">{copy.worksCount(worksCount)}</p>
            {drafts.length > 0 && (
              <div className="flex flex-col gap-2 rounded-md border border-gold/50 bg-gold-soft p-3" data-testid="pf-drafts">
                <p className="text-14 font-medium">{copy.drafts(drafts.length)}</p>
                <ul className="flex flex-col gap-1">
                  {drafts.map((draft) => (
                    <li key={draft.id}>
                      <Link href={`/painel/projetos?projeto=${draft.id}`} className="focus-ring rounded-sm text-14 underline underline-offset-2 hovered:text-accent">
                        {copy.reviewDraft(draft.company_name)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-13 text-muted">{copy.worksHelp}</p>
            <Button asChild variant="secondary" size="sm" className="self-start">
              <Link href="/painel/projetos">{copy.worksOpen}</Link>
            </Button>
          </section>

          <section aria-label={copy.sections.processAndValues} id="sec-process" className="panel flex scroll-mt-24 flex-col gap-4 p-5">
            <PanelHeader id="pf-process" icon={Footprints} title={copy.processTitle} as="h3" />
            <p className="text-13 text-muted">{copy.processHelp}</p>
            {form.processSteps.map((step, index) => (
              <div key={index} className="panel-row flex flex-col gap-3 p-3">
                <Field label={<Numbered label={copy.stepTitle} n={index + 1} />}>
                  <Input
                    value={step.title}
                    maxLength={LIMITS.stepTitle}
                    onChange={(event) => update({ processSteps: form.processSteps.map((s, i) => (i === index ? { ...s, title: event.target.value } : s)) })}
                  />
                </Field>
                <Field label={<Numbered label={copy.stepText} n={index + 1} />}>
                  <Input
                    value={step.text}
                    maxLength={LIMITS.stepText}
                    onChange={(event) => update({ processSteps: form.processSteps.map((s, i) => (i === index ? { ...s, text: event.target.value } : s)) })}
                  />
                </Field>
              </div>
            ))}
            <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
              <h4 className="text-14 font-semibold">{copy.values.title}</h4>
              <ul className="flex flex-col gap-1.5 text-13 text-muted">
                <li>
                  <b className="text-foreground">{copy.values.build}:</b> {copy.values.buildText}
                </li>
                <li>
                  <b className="text-foreground">{copy.values.thirdParty}:</b> {copy.values.thirdPartyText}
                </li>
                <li>
                  <b className="text-foreground">{copy.values.maintenance}:</b> {copy.values.maintenanceText}
                </li>
              </ul>
              <Field label={copy.values.priceFrom} help={copy.values.priceFromHelp}>
                <Input name="priceFrom" value={form.priceFrom} maxLength={LIMITS.priceFrom} onChange={(event) => update({ priceFrom: event.target.value })} />
              </Field>
            </div>
          </section>

          <section aria-label={copy.sections.publishing} id="sec-publishing" className="panel flex scroll-mt-24 flex-col gap-5 p-5">
            <Toggle id="pf-published" title={copy.publish} help={copy.publishHelp} checked={form.published} onChange={(published) => update({ published })} />
            <Toggle id="pf-google" title={copy.google} help={copy.googleHelp} checked={form.indexable} onChange={(indexable) => update({ indexable })} />
          </section>

          <div aria-live="polite" className="flex flex-col gap-2">
            {confirmSlug && saved.slug && (
              <div data-testid="slug-confirm">
                <Callout role="alert" tone="amber">
                  {check.changePublished(publicUrl(saved.slug))}
                </Callout>
              </div>
            )}
            {(error === "url" || error === "tooLong" || error === "generic" || error === "serviceLine" || error === "step" || error === "secret") && (
              <Callout role="alert" tone="danger">
                {copy.errors[error]}
              </Callout>
            )}
          </div>
          {/* Barra de guardar fixa em baixo enquanto se edita (no telemóvel, por cima do menu). */}
          <div
            data-testid="pf-save-bar"
            className="sticky bottom-[calc(72px+env(safe-area-inset-bottom)+var(--badge-space))] z-20 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3 shadow-float md:bottom-[calc(16px+var(--badge-space))]"
          >
            <Button type="submit" loading={saving} loadingText={ptPT.contacts.saving}>
              {copy.save}
            </Button>
            {saved.slug && saved.published && (
              <Button asChild variant="ghost" size="sm">
                <a href={saved.slug === homeSlug ? "/" : `/p/${saved.slug}`} target="_blank" rel="noreferrer noopener">
                  <ExternalLink aria-hidden="true" size={14} strokeWidth={1.75} />
                  {copy.open}
                </a>
              </Button>
            )}
            <span role="status" className={dirty ? "text-13 font-medium text-amber" : "text-13 text-muted"}>
              {dirty ? copy.unsaved : copy.allSaved}
            </span>
          </div>
          <p className="text-13 text-muted">{copy.templateTip}</p>
        </form>

        <TestimonialsEditor initial={testimonials} projects={projects} />
      </div>

      <section aria-label={copy.preview} className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 text-13 font-medium text-muted">{copy.preview}</p>
        <div tabIndex={0} className="focus-ring max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-lg border border-panel-border shadow-float">
          <PortfolioView portfolio={preview} preview />
        </div>
      </section>
    </div>
  );
}
