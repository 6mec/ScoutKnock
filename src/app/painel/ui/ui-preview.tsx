"use client";

import { Search } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { Card, Panel } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Kbd } from "@/components/ui/kbd";
import { LiveDot } from "@/components/ui/live-dot";
import { Logo } from "@/components/ui/logo";
import { Progress } from "@/components/ui/progress";
import { Reveal } from "@/components/ui/reveal";
import { ScoreBreakdown } from "@/components/ui/score-breakdown";
import { ScoreChip } from "@/components/ui/score-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Toaster, toast } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import { ptPT } from "@/i18n/pt-PT";
import { SAMPLE_COMPANIES } from "@/lib/radar/sample-companies";
import { scoreCompany } from "@/lib/radar/score";

const copy = ptPT.uiPreview;
const { states, sections } = copy;

const BUTTON_VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "ghost",
  "danger",
];
const BADGE_VARIANTS: BadgeVariant[] = [
  "neutral",
  "accent",
  "amber",
  "danger",
  "outline",
];
const COLOR_SWATCHES = [
  "bg-canvas",
  "bg-background",
  "bg-surface",
  "bg-surface-raised",
  "bg-border-subtle",
  "bg-border",
  "bg-border-strong",
  "bg-border-input",
  "bg-muted",
  "bg-foreground",
  "bg-accent",
  "bg-accent-soft",
  "bg-amber",
  "bg-danger",
];
const TEXT_SIZES = [
  "text-12",
  "text-13",
  "text-14",
  "text-16",
  "text-18",
  "text-20",
  "text-24",
  "text-32",
  "text-44",
  "text-48",
  "text-64",
  "text-84",
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border-subtle pt-8">
      <h2 className="section-label text-accent">{title}</h2>
      {children}
    </section>
  );
}

function State({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-2">
      <span className="text-13 text-muted">{label}</span>
      {children}
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-start gap-6">{children}</div>;
}

export function UiPreview() {
  const [companyIndex, setCompanyIndex] = useState(0);
  const [replay, setReplay] = useState(0);
  const company = SAMPLE_COMPANIES[companyIndex];
  const opportunity = scoreCompany(company, "website_creation");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-12">
      <Toaster />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="type-heading text-32">{copy.title}</h2>
          <p className="type-body text-muted">{copy.intro}</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => document.documentElement.classList.toggle("dark")}
        >
          {copy.toggleTheme}
        </Button>
      </div>

      <Section title={sections.tokens}>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {COLOR_SWATCHES.map((swatch) => (
            <div key={swatch} className="flex flex-col gap-1">
              <div
                className={`h-12 rounded-sm border border-border ${swatch}`}
              />
              <span className="type-number text-12 break-all text-muted">
                {swatch.replace("bg-", "")}
              </span>
            </div>
          ))}
        </div>
        <Row>
          {["rounded-sm", "rounded-md", "rounded-lg", "rounded-pill"].map(
            (radius) => (
              <State key={radius} label={radius}>
                <div className={`h-12 w-20 border border-border-strong ${radius}`} />
              </State>
            ),
          )}
          <State label="shadow-float">
            <div className="h-12 w-20 rounded-md bg-surface-raised shadow-float" />
          </State>
          <State label="shadow-halo">
            <div className="h-12 w-20 rounded-md bg-surface-raised shadow-halo" />
          </State>
        </Row>
      </Section>

      <Section title={sections.type}>
        <div className="flex flex-col gap-3 overflow-hidden">
          {TEXT_SIZES.map((size) => (
            <div key={size} className="flex items-baseline gap-4">
              <span className="type-number w-16 shrink-0 text-12 text-muted">
                {size.replace("text-", "")}
              </span>
              <span className={`type-heading whitespace-nowrap ${size}`}>
                {copy.typeSample}
              </span>
            </div>
          ))}
        </div>
        <p className="section-label text-accent">{copy.sectionLabel}</p>
        <p className="type-body text-16">{copy.bodySample}</p>
        <p className="type-number text-20">{copy.numberSample}</p>
      </Section>

      <Section title={sections.motion}>
        <div>
          <Button variant="secondary" onClick={() => setReplay(replay + 1)}>
            {copy.replay}
          </Button>
        </div>
        <div key={replay} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Reveal key={index} index={index}>
              <Card>
                {copy.revealItem} {index + 1}
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section title={sections.button}>
        {BUTTON_VARIANTS.map((variant) => (
          <div key={variant} className="flex flex-col gap-3">
            <h3 className="font-bold">{copy.variants[variant]}</h3>
            <Row>
              <State label={states.normal}>
                <Button variant={variant}>{copy.buttonLabel}</Button>
              </State>
              <State label={states.hover}>
                <Button variant={variant} data-preview="hover">
                  {copy.buttonLabel}
                </Button>
              </State>
              <State label={states.focus}>
                <Button variant={variant} data-preview="focus">
                  {copy.buttonLabel}
                </Button>
              </State>
              <State label={states.pressed}>
                <Button variant={variant} data-preview="pressed">
                  {copy.buttonLabel}
                </Button>
              </State>
              <State label={states.disabled}>
                <Button variant={variant} disabled>
                  {copy.buttonLabel}
                </Button>
              </State>
              <State label={states.loading}>
                <Button
                  variant={variant}
                  loading
                  loadingText={copy.buttonLoading}
                >
                  {copy.buttonLabel}
                </Button>
              </State>
              <State label={states.error}>
                <Button variant={variant} error>
                  {copy.buttonLabel}
                </Button>
              </State>
            </Row>
          </div>
        ))}
        <Row>
          <State label={copy.sizes.small}>
            <Button size="sm">
              <Search aria-hidden="true" size={16} strokeWidth={1.75} />
              {copy.buttonLabel}
            </Button>
          </State>
          <State label={copy.sizes.medium}>
            <Button size="md">{copy.buttonLabel}</Button>
          </State>
          <State label={copy.sizes.large}>
            <Button size="lg">{copy.buttonLabel}</Button>
          </State>
        </Row>
      </Section>

      <Section title={sections.field}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={states.normal} help={copy.fieldHelp}>
            <Input placeholder={copy.fieldPlaceholder} />
          </Field>
          <Field label={states.hover}>
            <Input data-preview="hover" placeholder={copy.fieldPlaceholder} />
          </Field>
          <Field label={states.focus}>
            <Input data-preview="focus" placeholder={copy.fieldPlaceholder} />
          </Field>
          <Field label={states.disabled}>
            <Input disabled placeholder={copy.fieldPlaceholder} />
          </Field>
          <Field label={states.loading}>
            <Input loading defaultValue={company.locality} />
          </Field>
          <Field label={states.error} error={copy.fieldError}>
            <Input placeholder={copy.fieldPlaceholder} />
          </Field>
          <Field label={copy.selectLabel}>
            <Select defaultValue="a">
              <option value="a">{copy.selectOption}</option>
            </Select>
          </Field>
          <Field label={`${copy.selectLabel}: ${states.error}`} error={copy.fieldError}>
            <Select defaultValue="a">
              <option value="a">{copy.selectOption}</option>
            </Select>
          </Field>
          <Field label={`${copy.selectLabel}: ${states.disabled}`}>
            <Select disabled defaultValue="a">
              <option value="a">{copy.selectOption}</option>
            </Select>
          </Field>
          <Field label={copy.textareaLabel}>
            <Textarea placeholder={copy.textareaPlaceholder} />
          </Field>
          <Field label={`${copy.textareaLabel}: ${states.error}`} error={copy.fieldError}>
            <Textarea placeholder={copy.textareaPlaceholder} />
          </Field>
          <Field label={`${copy.textareaLabel}: ${states.disabled}`}>
            <Textarea disabled placeholder={copy.textareaPlaceholder} />
          </Field>
        </div>
      </Section>

      <Section title={sections.card}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <State label={states.normal}>
            <Card className="w-full">
              <p className="font-bold">{copy.cardTitle}</p>
              <p className="text-14 text-muted">{copy.cardBody}</p>
            </Card>
          </State>
          {(
            [
              [copy.cardInteractive, undefined],
              [states.hover, "hover"],
              [states.focus, "focus"],
              [states.pressed, "pressed"],
            ] as const
          ).map(([label, preview]) => (
            <State key={label} label={label}>
              <Card interactive asChild className="w-full">
                <a href="#" data-preview={preview}>
                  <p className="font-bold">{copy.cardTitle}</p>
                  <p className="text-14 text-muted">{copy.cardBody}</p>
                </a>
              </Card>
            </State>
          ))}
          <State label={states.disabled}>
            <Card disabled className="w-full">
              <p className="font-bold">{copy.cardTitle}</p>
              <p className="text-14 text-muted">{copy.cardBody}</p>
            </Card>
          </State>
          <State label={states.loading}>
            <Card className="flex w-full flex-col gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
            </Card>
          </State>
          <State label={states.error}>
            <Card error className="w-full">
              <p className="font-bold">{copy.cardTitle}</p>
              <p className="text-14 text-danger">{copy.toastErrorText}</p>
            </Card>
          </State>
        </div>
        <Panel>
          <h3 className="type-heading text-20">{copy.panelTitle}</h3>
          <p className="type-body mt-2 text-muted">{copy.panelBody}</p>
        </Panel>
      </Section>

      <Section title={sections.badge}>
        <Row>
          {BADGE_VARIANTS.map((variant) => (
            <Badge key={variant} variant={variant}>
              {copy.badges[variant]}
            </Badge>
          ))}
        </Row>
        <Row>
          <span className="inline-flex gap-1">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </span>
        </Row>
      </Section>

      <Section title={sections.tabs}>
        <Tabs defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">{copy.tabs.one}</TabsTrigger>
            <TabsTrigger value="two" data-preview="hover">
              {copy.tabs.two}
            </TabsTrigger>
            <TabsTrigger value="three" data-preview="focus">
              {copy.tabs.three}
            </TabsTrigger>
            <TabsTrigger value="four" disabled>
              {copy.tabs.disabled}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="one">{copy.tabContent}: {copy.tabs.one}</TabsContent>
          <TabsContent value="two">{copy.tabContent}: {copy.tabs.two}</TabsContent>
          <TabsContent value="three">{copy.tabContent}: {copy.tabs.three}</TabsContent>
        </Tabs>
      </Section>

      <Section title={sections.overlays}>
        <Row>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">{copy.openDialog}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>{copy.dialogTitle}</DialogTitle>
              <DialogDescription>{copy.dialogBody}</DialogDescription>
              <div className="flex flex-wrap justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="ghost">{copy.dialogCancel}</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button>{copy.dialogConfirm}</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">{copy.openMenu}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{copy.menuLabel}</DropdownMenuLabel>
              <DropdownMenuItem>{copy.menuItem}</DropdownMenuItem>
              <DropdownMenuItem>{copy.menuItemTwo}</DropdownMenuItem>
              <DropdownMenuItem disabled>
                {copy.menuItemDisabled}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem danger>{copy.menuItemDanger}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip content={copy.tooltipContent}>
            <Button variant="ghost">{copy.tooltipTrigger}</Button>
          </Tooltip>
        </Row>
      </Section>

      <Section title={sections.feedback}>
        <div className="grid gap-6 sm:grid-cols-2">
          <State label={states.loading}>
            <div className="flex w-full flex-col gap-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </State>
          <div className="flex flex-col gap-3">
            <State label={states.normal}>
              <Progress value={60} label={copy.progressLabel} className="w-full" />
            </State>
            <State label={states.loading}>
              <Progress label={copy.progressLabel} className="w-full" />
            </State>
            <State label={states.error}>
              <Progress
                value={40}
                tone="danger"
                label={copy.progressLabel}
                className="w-full"
              />
            </State>
          </div>
        </div>
        <Row>
          <Button
            variant="secondary"
            onClick={() => toast.success(copy.toastSuccessText)}
          >
            {copy.toastSuccess}
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.error(copy.toastErrorText)}
          >
            {copy.toastError}
          </Button>
        </Row>
      </Section>

      <Section title={sections.avatar}>
        <Row>
          <State label={states.normal}>
            <Avatar
              src="/brand/scoutknock-mark.svg"
              alt={copy.avatarAlt}
              initials={copy.avatarInitials}
            />
          </State>
          <State label={states.error}>
            <Avatar
              src="/nao-existe.png"
              alt={copy.avatarAlt}
              initials={copy.avatarInitials}
            />
          </State>
          <State label={states.loading}>
            <Skeleton className="size-10 rounded-pill" />
          </State>
        </Row>
      </Section>

      <Section title={sections.score}>
        <Row>
          <ScoreChip score={90} />
          <ScoreChip score={50} />
          <ScoreChip score={10} />
          <State label={states.loading}>
            <ScoreChip loading />
          </State>
          <State label={states.error}>
            <ScoreChip error />
          </State>
        </Row>
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold">{company.name}</p>
              <Badge variant="amber">{ptPT.radar.sampleBadge}</Badge>
            </div>
            <ScoreBreakdown opportunity={opportunity} />
            <div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setCompanyIndex((companyIndex + 1) % SAMPLE_COMPANIES.length)
                }
              >
                {copy.nextCompany}
              </Button>
            </div>
          </Card>
          <Card>
            <State label={states.loading}>
              <ScoreBreakdown loading className="w-full" />
            </State>
          </Card>
        </div>
      </Section>

      <Section title={sections.empty}>
        <EmptyState
          title={copy.emptyTitle}
          action={<Button variant="secondary">{copy.emptyAction}</Button>}
        />
      </Section>

      <Section title={sections.live}>
        <Row>
          <LiveDot status="live" />
          <LiveDot status="searching" />
        </Row>
      </Section>

      <Section title={sections.logo}>
        <Row>
          <State label={states.normal}>
            <Logo />
          </State>
          <State label={states.loading}>
            <Logo searching />
          </State>
          <State label="24 px">
            <Logo size={24} showWordmark={false} />
          </State>
          <State label={states.loading}>
            <Spinner />
          </State>
        </Row>
      </Section>
    </div>
  );
}
