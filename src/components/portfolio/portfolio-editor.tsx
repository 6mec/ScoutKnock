"use client";

import {
  BriefcaseBusiness,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  UserRound,
  Wrench,
  Phone,
} from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Field, Input, Textarea } from "@/components/ui/field";
import { PanelHeader } from "@/components/ui/panel-header";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { savePortfolio } from "@/lib/portfolio/actions";
import {
  LIMITS,
  MAX_PROJECTS,
  MAX_SERVICES,
  parsePortfolio,
  type PortfolioError,
  type PublicPortfolio,
} from "@/lib/portfolio/rules";
import { PortfolioView } from "./portfolio-view";

const copy = ptPT.portfolio;

export type PortfolioFormValues = {
  slug: string;
  published: boolean;
  displayName: string;
  headline: string;
  about: string;
  city: string;
  whatsapp: string;
  email: string;
  services: { title: string; description: string }[];
  projects: { title: string; description: string; url: string }[];
  showSites: boolean;
};

function Numbered({ label, n }: { label: string; n: number }) {
  return (
    <>
      {label}
      <span className="sr-only">{copy.itemNumber(n)}</span>
    </>
  );
}

export function PortfolioEditor({
  initial,
  savedSlug,
  savedPublished,
  sites,
  siteUrl,
}: {
  initial: PortfolioFormValues;
  savedSlug: string | null;
  savedPublished: boolean;
  sites: PublicPortfolio["sites"];
  siteUrl: string;
}) {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState({ slug: savedSlug, published: savedPublished });
  const [error, setError] = useState<PortfolioError | "taken" | "generic" | null>(null);
  const [saving, startSaving] = useTransition();
  const publicUrl = (slug: string) => new URL(`/p/${slug}`, siteUrl).toString();

  function update(values: Partial<PortfolioFormValues>) {
    setForm((current) => ({ ...current, ...values }));
    setError(null);
  }

  // A pré-visualização usa as mesmas regras que o servidor.
  const parsed = parsePortfolio(form);
  const preview: PublicPortfolio = {
    slug: form.slug || "previsualizacao",
    display_name: form.displayName.trim() || copy.displayName,
    headline: form.headline.trim() || null,
    about: form.about.trim() || null,
    city: form.city.trim() || null,
    whatsapp: parsed.ok ? parsed.portfolio.whatsapp : null,
    email: parsed.ok ? parsed.portfolio.email : null,
    services: parsed.ok ? parsed.portfolio.services : [],
    projects: parsed.ok ? parsed.portfolio.projects : [],
    sites: form.showSites ? sites : [],
  };

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startSaving(async () => {
      const result = await savePortfolio(form);
      if (result.ok) {
        setSaved({ slug: form.slug.toLowerCase(), published: form.published });
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

  return (
    <div className="grid w-full gap-6 px-4 pt-4 pb-6 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:px-8">
      <form onSubmit={handleSubmit} noValidate className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Badge variant={saved.published ? "accent" : "outline"} className="self-start">
            {saved.published ? copy.published : copy.draft}
          </Badge>
          {saved.slug && saved.published && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild variant="secondary" size="sm">
                <a href={`/p/${saved.slug}`} target="_blank" rel="noreferrer noopener">
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

        <section aria-labelledby="pf-basics" className="panel flex flex-col gap-4 p-5">
          <PanelHeader id="pf-basics" icon={UserRound} title={copy.sections.basics} as="h3" />
          <Field label={copy.displayName} error={error === "displayName" ? copy.errors.displayName : undefined}>
            <Input
              value={form.displayName}
              maxLength={LIMITS.displayName}
              onChange={(event) => update({ displayName: event.target.value })}
            />
          </Field>
          <Field
            label={copy.slug}
            help={form.slug ? copy.slugHelp(publicUrl(form.slug.toLowerCase())) : undefined}
            error={
              error === "slug" ? copy.errors.slug : error === "taken" ? copy.errors.taken : undefined
            }
          >
            <Input
              value={form.slug}
              maxLength={40}
              autoCapitalize="none"
              spellCheck={false}
              onChange={(event) => update({ slug: event.target.value })}
            />
          </Field>
          <Field label={copy.headline}>
            <Input
              value={form.headline}
              maxLength={LIMITS.headline}
              placeholder={copy.headlinePlaceholder}
              onChange={(event) => update({ headline: event.target.value })}
            />
          </Field>
          <Field label={copy.about}>
            <Textarea
              value={form.about}
              maxLength={LIMITS.about}
              placeholder={copy.aboutPlaceholder}
              onChange={(event) => update({ about: event.target.value })}
            />
          </Field>
          <Field label={copy.city}>
            <Input
              value={form.city}
              maxLength={LIMITS.city}
              onChange={(event) => update({ city: event.target.value })}
            />
          </Field>
        </section>

        <section aria-labelledby="pf-contact" className="panel flex flex-col gap-4 p-5">
          <PanelHeader id="pf-contact" icon={Phone} title={copy.sections.contact} as="h3" />
          <Field
            label={copy.whatsapp}
            help={copy.whatsappHelp}
            error={error === "whatsapp" ? copy.errors.whatsapp : undefined}
          >
            <Input
              type="tel"
              value={form.whatsapp}
              maxLength={LIMITS.whatsapp}
              onChange={(event) => update({ whatsapp: event.target.value })}
            />
          </Field>
          <Field label={copy.email} error={error === "email" ? copy.errors.email : undefined}>
            <Input
              type="email"
              value={form.email}
              maxLength={LIMITS.email}
              onChange={(event) => update({ email: event.target.value })}
            />
          </Field>
        </section>

        <section aria-labelledby="pf-services" className="panel flex flex-col gap-4 p-5">
          <PanelHeader id="pf-services" icon={Wrench} title={copy.sections.services} as="h3" />
          {form.services.map((service, index) => (
            <div key={index} className="panel-row flex flex-col gap-3 p-3">
              <div className="flex items-end gap-2">
                <Field label={<Numbered label={copy.serviceTitle} n={index + 1} />} className="flex-1">
                  <Input
                    value={service.title}
                    maxLength={LIMITS.itemTitle}
                    placeholder={copy.servicePlaceholder}
                    onChange={(event) =>
                      update({
                        services: form.services.map((s, i) =>
                          i === index ? { ...s, title: event.target.value } : s,
                        ),
                      })
                    }
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
              <Field label={<Numbered label={copy.serviceDescription} n={index + 1} />}>
                <Input
                  value={service.description}
                  maxLength={LIMITS.itemDescription}
                  onChange={(event) =>
                    update({
                      services: form.services.map((s, i) =>
                        i === index ? { ...s, description: event.target.value } : s,
                      ),
                    })
                  }
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

        <section aria-labelledby="pf-projects" className="panel flex flex-col gap-4 p-5">
          <PanelHeader id="pf-projects" icon={BriefcaseBusiness} title={copy.sections.projects} as="h3" />
          {form.projects.map((project, index) => (
            <div key={index} className="panel-row flex flex-col gap-3 p-3">
              <div className="flex items-end gap-2">
                <Field label={<Numbered label={copy.projectTitle} n={index + 1} />} className="flex-1">
                  <Input
                    value={project.title}
                    maxLength={LIMITS.itemTitle}
                    placeholder={copy.projectPlaceholder}
                    onChange={(event) =>
                      update({
                        projects: form.projects.map((p, i) =>
                          i === index ? { ...p, title: event.target.value } : p,
                        ),
                      })
                    }
                  />
                </Field>
                <Button
                  variant="ghost"
                  aria-label={copy.remove(copy.projectTitle.toLowerCase(), index + 1)}
                  onClick={() => update({ projects: form.projects.filter((_, i) => i !== index) })}
                  className="mb-0.5 px-3"
                >
                  <Trash2 aria-hidden="true" size={16} strokeWidth={1.75} />
                </Button>
              </div>
              <Field label={<Numbered label={copy.projectDescription} n={index + 1} />}>
                <Input
                  value={project.description}
                  maxLength={LIMITS.itemDescription}
                  onChange={(event) =>
                    update({
                      projects: form.projects.map((p, i) =>
                        i === index ? { ...p, description: event.target.value } : p,
                      ),
                    })
                  }
                />
              </Field>
              <Field label={<Numbered label={copy.projectUrl} n={index + 1} />}>
                <Input
                  inputMode="url"
                  value={project.url}
                  maxLength={LIMITS.url}
                  onChange={(event) =>
                    update({
                      projects: form.projects.map((p, i) =>
                        i === index ? { ...p, url: event.target.value } : p,
                      ),
                    })
                  }
                />
              </Field>
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            disabled={form.projects.length >= MAX_PROJECTS}
            onClick={() =>
              update({ projects: [...form.projects, { title: "", description: "", url: "" }] })
            }
          >
            <Plus aria-hidden="true" size={16} strokeWidth={1.75} />
            {copy.addProject}
          </Button>
          <div className="flex items-start justify-between gap-4 border-t border-border-subtle pt-4">
            <label htmlFor="pf-show-sites" className="flex flex-col gap-1">
              <span className="text-14 font-medium">{copy.showSites}</span>
              <span className="text-13 text-muted">{copy.showSitesHelp}</span>
            </label>
            <Switch
              id="pf-show-sites"
              checked={form.showSites}
              onCheckedChange={(showSites) => update({ showSites })}
            />
          </div>
        </section>

        <div className="panel flex items-start justify-between gap-4 p-5">
          <label htmlFor="pf-published" className="flex flex-col gap-1">
            <span className="text-14 font-semibold">{copy.publish}</span>
            <span className="text-13 text-muted">{copy.publishHelp}</span>
          </label>
          <Switch
            id="pf-published"
            checked={form.published}
            onCheckedChange={(published) => update({ published })}
          />
        </div>

        <div aria-live="polite">
          {(error === "url" || error === "tooLong" || error === "generic") && (
            <Callout role="alert" tone="danger">
              {copy.errors[error]}
            </Callout>
          )}
        </div>
        <Button type="submit" size="lg" loading={saving} loadingText={ptPT.contacts.saving}>
          {copy.save}
        </Button>
        <p className="text-13 text-muted">{copy.templateTip}</p>
      </form>

      <section aria-label={copy.preview} className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 text-13 font-medium text-muted">{copy.preview}</p>
        <div
          tabIndex={0}
          className="focus-ring max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-lg border border-panel-border shadow-float"
        >
          <PortfolioView portfolio={preview} preview />
        </div>
      </section>
    </div>
  );
}
