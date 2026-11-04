import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  Circle,
  ListChecks,
  CreditCard,
  Euro,
  Gauge,
  Globe,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { NewSearchLink } from "@/components/app/new-search-link";
import { StatusDot } from "@/components/contacts/status-dot";
import { RefreshOnShow } from "@/components/dashboard/refresh-on-show";
import { RepeatSearchButton } from "@/components/dashboard/repeat-search-button";
import { PlanSubmitButton } from "@/components/plans/plan-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PanelHeader } from "@/components/ui/panel-header";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { isCurrentUserAdmin } from "@/lib/account/admin";
import { PLANS } from "@/lib/account/rules";
import { requireUser } from "@/lib/auth/current-user";
import { openBillingPortal } from "@/lib/billing/actions";
import {
  currencyForLocale,
  hasLiveSubscription,
  isPaymentProblem,
  parseBillingConfig,
} from "@/lib/billing/rules";
import {
  contactedToday,
  DEFAULT_DAILY_GOAL,
  dealTotals,
  type ContactEvent,
} from "@/lib/contacts/crm";
import { CONTACT_STATUSES, type Contact } from "@/lib/contacts/rules";
import {
  ONBOARDING_LINKS,
  ONBOARDING_STEPS,
  onboardingProgress,
} from "@/lib/dashboard/onboarding";
import {
  DEMO_WARNING_DAYS,
  daysUntil,
  hasActivePlan,
  nextStep,
  repeatQuery,
  totalLeads,
  usageMeters,
  type DashboardData,
} from "@/lib/dashboard/rules";
import { reportError } from "@/lib/events/log";
import { enabledMarkets } from "@/lib/markets";
import { getCompanyProvider } from "@/lib/radar/provider";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const { dashboard: copy } = ptPT;
const dateFormat = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "long",
  timeZone: "Europe/Lisbon",
});
const shortDate = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "medium",
  timeZone: "Europe/Lisbon",
});
const formatDate = (date: string) => dateFormat.format(new Date(date));

export const metadata: Metadata = {
  title: ptPT.app.nav.home,
  robots: { index: false },
};

function Block({
  id,
  title,
  icon,
  className,
  children,
}: {
  id: string;
  title: string;
  icon: LucideIcon;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      data-testid={`block-${id}`}
      className={cn("panel flex min-w-0 flex-col gap-4 p-5", className)}
    >
      <PanelHeader id={id} icon={icon} title={title} as="h3" />
      {children}
    </section>
  );
}

function renewalText({ subscription, usage }: DashboardData) {
  if (subscription.status === "trialing") {
    return copy.usage.trialEnds(formatDate(usage.period_end));
  }
  if (subscription.cancel_at_period_end) {
    return copy.usage.endsOn(formatDate(usage.period_end));
  }
  return copy.usage.renews(formatDate(usage.period_end));
}

function UsageBlock({ data, isAdmin }: { data: DashboardData; isAdmin: boolean }) {
  const plansLink = (
    <Link href="/painel/planos" className="focus-ring inline-flex min-h-11 items-center rounded-sm text-14 text-accent underline">
      {hasActivePlan(data) ? copy.usage.seePlansUpgrade : copy.usage.seePlans}
    </Link>
  );

  return (
    <Block id="consumo" title={copy.usage.title} icon={Gauge}>
      {isAdmin ? (
        <div data-testid="admin-usage" className="flex flex-col gap-2">
          <p className="font-semibold">{ptPT.plans.admin.state}</p>
          <p className="type-number text-14 text-muted">
            {copy.usage.adminUsed(
              data.usage.searches_used,
              data.usage.demos_used,
              data.usage.lookups_used,
            )}
          </p>
          <p className="text-14 text-muted">{ptPT.plans.admin.note}</p>
        </div>
      ) : (
      <ul className="flex flex-col gap-4">
        {usageMeters(data).map(({ key, used, limit, percent, reached }) => {
          const text = copy.usage.meter[key](used, limit);

          return (
            <li key={key} data-testid={`meter-${key}`} className="flex flex-col gap-2">
              <p className="type-number text-14">{text}</p>
              <Progress value={percent} tone={reached ? "amber" : "accent"} label={text} />
              {key === "lookups" && (
                <p className="type-number text-13 text-muted">
                  {copy.usage.lookupsToday(
                    data.usage.lookups_today,
                    data.usage.lookups_daily_limit,
                  )}
                </p>
              )}
              {reached && (
                <div role="status" className="flex flex-col items-start text-14 text-amber">
                  <p>{copy.usage.reached[key]}</p>
                  {plansLink}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      )}
      <p className="text-14 text-muted">{renewalText(data)}</p>
    </Block>
  );
}

function NextStepBlock({
  data,
  now,
  billingOn,
}: {
  data: DashboardData;
  now: number;
  billingOn: boolean;
}) {
  const step = nextStep(data, now);
  const renews = formatDate(data.usage.period_end);
  const action = (href: string, label: string) => (
    <Button asChild size="lg">
      <Link href={href}>{label}</Link>
    </Button>
  );
  const plans = billingOn ? copy.next.subscribe : copy.usage.seePlans;

  const content: Record<typeof step.kind, () => [string, ReactNode]> = {
    paymentProblem: () => [
      copy.next.paymentProblem,
      billingOn && data.subscription.has_customer ? (
        <form action={openBillingPortal}>
          <PlanSubmitButton>{copy.subscription.manage}</PlanSubmitButton>
        </form>
      ) : (
        action("/painel/planos", copy.usage.seePlans)
      ),
    ],
    limitSubscribe: () => [copy.next.limit(renews), action("/painel/planos", plans)],
    limitUpgrade: () => [
      copy.next.limitUpgrade(renews),
      action("/painel/planos", copy.usage.seePlansUpgrade),
    ],
    limitWait: () => [copy.next.limitWait(renews), null],
    expiringDemo: () => {
      if (step.kind !== "expiringDemo") return ["", null];
      return [
        copy.next.expiringDemo(step.name ?? copy.demos.noName, step.days),
        action(`/painel/demos/${step.id}`, copy.demos.open),
      ];
    },
    toContact: () => {
      if (step.kind !== "toContact") return ["", null];
      return [
        copy.next.toContact(step.count),
        action("/painel/contactos?estado=to_contact", copy.next.openContacts),
      ];
    },
    firstSearch: () => [
      copy.next.firstSearch,
      <NewSearchLink key="first">{copy.newSearch}</NewSearchLink>,
    ],
    saveCompany: () => [
      copy.next.saveCompany,
      <NewSearchLink key="save">{copy.newSearch}</NewSearchLink>,
    ],
    newSearch: () => [
      copy.next.newSearch,
      <NewSearchLink key="new">{copy.newSearch}</NewSearchLink>,
    ],
  };
  const [text, button] = content[step.kind]();

  return (
    <Block
      id="proximo-passo"
      title={copy.next.title}
      icon={ArrowRight}
      className="panel-glow"
    >
      <p data-testid="next-step" className="type-heading text-20 lg:text-24">
        {text}
      </p>
      {button && <div className="mt-auto flex flex-wrap">{button}</div>}
    </Block>
  );
}

function LeadsBlock({ data }: { data: DashboardData }) {
  return (
    <Block id="contactos" title={copy.leads.title} icon={Users} className="lg:col-span-2">
      {totalLeads(data.leads) === 0 ? (
        <EmptyLine text={copy.leads.empty} />
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {CONTACT_STATUSES.map((status) => (
            <li key={status}>
              <Link
                href={`/painel/contactos?estado=${status}`}
                className="panel-row focus-ring flex min-h-11 flex-col gap-1 p-3 transition-colors duration-(--duration-fast) ease-out hovered:border-accent/40"
              >
                <span className="type-number text-24 font-semibold">
                  {data.leads[status] ?? 0}
                </span>
                <span className="flex items-center gap-2 text-13 text-muted">
                  <StatusDot status={status} />
                  {ptPT.contacts.statuses[status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Block>
  );
}

const money = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

type Deals = {
  contacts: Pick<Contact, "status" | "deal_value" | "do_not_contact">[];
  events: ContactEvent[];
  goal: number;
};

// Valores escritos pelo freelancer nas fichas; nada é estimado nem inventado.
function DealsBlock({ deals, now }: { deals: Deals; now: number }) {
  const totals = dealTotals(deals.contacts);
  const done = contactedToday(deals.events, now);
  const stat = (id: string, label: string, value: string, detail?: string) => (
    <div
      key={id}
      data-testid={`deals-${id}`}
      className="panel-row flex flex-col gap-1 p-3"
    >
      <span className="text-13 text-muted">{label}</span>
      <span className="type-number text-24 font-semibold">{value}</span>
      {detail && <span className="type-number text-13 text-muted">{detail}</span>}
    </div>
  );

  return (
    <Block id="negocios" title={copy.deals.title} icon={Euro} className="lg:col-span-2">
      <div className="grid gap-2 sm:grid-cols-3">
        {stat("hoje", copy.deals.today, copy.deals.todayValue(done, deals.goal))}
        {stat("aberto", copy.deals.open, money.format(totals.open), copy.deals.count(totals.openCount))}
        {stat("ganho", copy.deals.won, money.format(totals.won), copy.deals.count(totals.wonCount))}
      </div>
      {totals.openCount + totals.wonCount === 0 && (
        <p className="text-14 text-muted">{copy.deals.noValues}</p>
      )}
      <Link href="/painel/contactos" className="focus-ring inline-flex min-h-11 items-center self-start rounded-sm text-14 text-accent underline">
        {copy.deals.openContacts}
      </Link>
    </Block>
  );
}

// Desaparece quando está tudo feito; cada passo leva ao sítio onde se faz.
function OnboardingBlock({ progress }: { progress: ReturnType<typeof onboardingProgress> }) {
  if (progress.complete) return null;
  const steps = copy.onboarding.steps;

  return (
    <Block id="primeiros-passos" title={copy.onboarding.title} icon={ListChecks} className="lg:col-span-2">
      <div className="flex flex-col gap-2">
        <p className="type-number text-14 text-muted">
          {copy.onboarding.progress(progress.count, progress.total)}
        </p>
        <Progress
          value={progress.percent}
          label={copy.onboarding.progress(progress.count, progress.total)}
        />
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ONBOARDING_STEPS.map((step) => {
          const done = progress.done[step];
          return (
            <li key={step}>
              <Link
                href={ONBOARDING_LINKS[step]}
                data-done={done || undefined}
                className="panel-row focus-ring flex min-h-11 items-start gap-3 p-3 text-14 transition-colors duration-(--duration-fast) hovered:border-accent/40"
              >
                {done ? (
                  <Check aria-hidden="true" size={18} strokeWidth={2.2} className="mt-px shrink-0 text-accent" />
                ) : (
                  <Circle aria-hidden="true" size={18} strokeWidth={1.75} className="mt-px shrink-0 text-muted" />
                )}
                <span className={cn(done && "text-muted line-through")}>
                  {steps[step]}
                  <span className="sr-only">
                    {" · "}
                    {done ? copy.onboarding.done : copy.onboarding.todo}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Block>
  );
}

function EmptyLine({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-muted">{text}</p>
      {action}
    </div>
  );
}

function SearchesBlock({
  data,
  isSample,
}: {
  data: DashboardData;
  isSample: boolean;
}) {
  const { searches_used: used, searches_limit: limit } = data.usage;

  return (
    <Block id="buscas" title={copy.searches.title} icon={Search}>
      {data.searches.length === 0 ? (
        <EmptyLine text={copy.searches.empty} />
      ) : (
        <>
          {isSample && (
            <Badge variant="amber" className="self-start">
              {ptPT.radar.sampleBadge}
            </Badge>
          )}
          <ul className="flex flex-col divide-y divide-border-subtle">
            {data.searches.map((search) => (
              <li
                key={search.created_at}
                data-testid="recent-search"
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-semibold break-words">
                    {search.niche} · {search.locality}
                  </p>
                  <p className="type-number text-13 text-muted">
                    {copy.searches.found(search.count)} ·{" "}
                    {shortDate.format(new Date(search.created_at))}
                  </p>
                </div>
                {used < limit && (
                  <RepeatSearchButton
                    query={repeatQuery(search)}
                    used={used}
                    limit={limit}
                  />
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </Block>
  );
}

function DemosBlock({ data, now }: { data: DashboardData; now: number }) {
  const { active, items } = data.demos;

  return (
    <Block id="demos" title={copy.demos.title} icon={Globe}>
      {active === 0 ? (
        <EmptyLine text={copy.demos.empty} />
      ) : (
        <>
          <p className="type-number text-14">{copy.demos.active(active)}</p>
          <ul className="flex flex-col divide-y divide-border-subtle">
            {items.map((demo) => {
              const days = daysUntil(demo.expires_at, now);
              const urgent = days <= DEMO_WARNING_DAYS;

              return (
                <li
                  key={demo.id}
                  data-testid="demo-row"
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-col items-start gap-1">
                    <p className="font-semibold break-words">
                      {demo.company_name || copy.demos.noName}
                    </p>
                    {urgent ? (
                      <Badge variant="amber">{copy.demos.deletedIn(days)}</Badge>
                    ) : (
                      <p className="type-number text-13 text-muted">
                        {copy.demos.deletedIn(days)}
                      </p>
                    )}
                  </div>
                  <Button asChild variant="secondary">
                    <Link
                      href={`/painel/demos/${demo.id}`}
                      aria-label={copy.demos.openLabel(demo.company_name || copy.demos.noName)}
                    >
                      {copy.demos.open}
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
          {active > items.length && (
            <Link href="/painel/demos" className="focus-ring inline-flex min-h-11 items-center self-start rounded-sm text-14 text-accent underline">
              {copy.demos.seeAll}
            </Link>
          )}
        </>
      )}
    </Block>
  );
}

function SubscriptionBlock({
  data,
  billingOn,
  locale,
  isAdmin,
}: {
  data: DashboardData;
  billingOn: boolean;
  locale?: string | null;
  isAdmin: boolean;
}) {
  const { subscription, usage } = data;
  const live = hasLiveSubscription(subscription.status);
  const planName = PLANS.find(({ id }) => id === subscription.plan)
    ? ptPT.plans.names[subscription.plan as (typeof PLANS)[number]["id"]]
    : null;
  const currency = currencyForLocale(locale, enabledMarkets());
  const money = new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  });

  // O papel de admin passa à frente do pack: os limites são os de admin.
  let state: string = copy.subscription.none;
  if (isAdmin) {
    state = ptPT.plans.admin.state;
  } else if (isPaymentProblem(subscription.status)) {
    state = copy.subscription.paymentProblem(planName ?? "");
  } else if (subscription.status === "trialing") {
    state = copy.subscription.trial(formatDate(subscription.trial_end ?? usage.period_end));
  } else if (subscription.status === "active" && planName) {
    state = subscription.cancel_at_period_end
      ? copy.subscription.ending(planName, formatDate(usage.period_end))
      : copy.subscription.active(planName);
  }

  return (
    <Block
      id="subscricao"
      title={copy.subscription.title}
      icon={CreditCard}
      className="lg:col-span-2"
    >
      <p
        role={isPaymentProblem(subscription.status) ? "alert" : undefined}
        data-testid="subscription-state"
        className={cn(isPaymentProblem(subscription.status) && "text-amber")}
      >
        {state}
      </p>
      {live ? (
        billingOn &&
        subscription.has_customer && (
          <form action={openBillingPortal} className="self-start">
            <PlanSubmitButton variant="secondary">
              {copy.subscription.manage}
            </PlanSubmitButton>
          </form>
        )
      ) : (
        <>
          <ul className="grid gap-2 md:grid-cols-3">
            {PLANS.map((plan) => (
              <li
                key={plan.id}
                className="panel-row flex flex-col gap-1 p-3"
              >
                <p className="font-semibold">{ptPT.plans.names[plan.id]}</p>
                {billingOn && (
                  <p className="text-14 text-muted">
                    {ptPT.plans.perMonth(money.format(plan.price[currency]))}
                  </p>
                )}
                <p className="type-number text-13 text-muted">
                  {copy.subscription.planLimits(plan.searches, plan.demos)}
                </p>
              </li>
            ))}
          </ul>
          <Button asChild variant="secondary" className="self-start">
            <Link href="/painel/planos">{copy.usage.seePlans}</Link>
          </Button>
        </>
      )}
    </Block>
  );
}

function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label={copy.loading}
      className="grid gap-4 lg:grid-cols-2"
    >
      <Skeleton className="h-72 rounded-lg" />
      <Skeleton className="h-72 rounded-lg" />
      <Skeleton className="h-32 rounded-lg lg:col-span-2" />
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-32 rounded-lg lg:col-span-2" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-300 flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-1">
        <h2 className="type-heading text-24 lg:text-32">{copy.title}</h2>
        <p className="text-muted">{copy.subtitle}</p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content />
      </Suspense>
    </div>
  );
}

// Só lê a base de dados, numa consulta: nunca chama o Google nem a Anthropic.
async function Content() {
  const user = await requireUser();
  const supabase = await createClient();
  // O dia de hoje em Lisboa começa no máximo 26 h antes de agora.
  const since = new Date(new Date().getTime() - 26 * 3_600_000).toISOString();
  const [{ data, error }, { data: profile }, dealRows, todayEvents, goalRow, templateRow, portfolioRow, isAdmin] =
    await Promise.all([
      supabase.rpc("my_dashboard"),
      supabase.from("profiles").select("locale").eq("id", user.id).maybeSingle(),
      supabase.from("contacts").select("status, deal_value, do_not_contact, last_contacted_at"),
      supabase
        .from("contact_events")
        .select("contact_id, kind, status, created_at")
        .eq("kind", "status")
        .gte("created_at", since),
      supabase.from("profiles").select("daily_goal").eq("id", user.id).maybeSingle(),
      supabase.from("profiles").select("whatsapp_template").eq("id", user.id).maybeSingle(),
      supabase.from("portfolios").select("published").eq("user_id", user.id).maybeSingle(),
      isCurrentUserAdmin(supabase),
    ]);

  // Vai para o ecrã de erro do painel, com "Tentar outra vez".
  if (error || !data) {
    await reportError("painel", error?.code ?? "sem dados", user.id);
    throw new Error("painel");
  }

  const dashboard = data as DashboardData;
  const now = new Date().getTime();
  const billingOn = parseBillingConfig(process.env) !== null;
  const isSample = getCompanyProvider({ userId: user.id })?.usesSampleData ?? false;
  // Se estas leituras falharem, o bloco mostra zeros em vez de partir o painel.
  const deals: Deals = {
    contacts: (dealRows.data ?? []) as Deals["contacts"],
    events: (todayEvents.data ?? []) as ContactEvent[],
    goal: (goalRow.data?.daily_goal as number | undefined) ?? DEFAULT_DAILY_GOAL,
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <RefreshOnShow />
      <OnboardingBlock
        progress={onboardingProgress({
          contacts: (dealRows.data ?? []) as Pick<Contact, "status" | "deal_value" | "last_contacted_at">[],
          hasTemplate: Boolean(templateRow.data?.whatsapp_template),
          demosMade: Math.max(dashboard.demos.active, dashboard.usage.demos_used),
          portfolioPublished: Boolean(portfolioRow.data?.published),
        })}
      />
      <UsageBlock data={dashboard} isAdmin={isAdmin} />
      <NextStepBlock data={dashboard} now={now} billingOn={billingOn} />
      <LeadsBlock data={dashboard} />
      <DealsBlock deals={deals} now={now} />
      <SearchesBlock data={dashboard} isSample={isSample} />
      <DemosBlock data={dashboard} now={now} />
      <SubscriptionBlock
        data={dashboard}
        billingOn={billingOn}
        locale={profile?.locale}
        isAdmin={isAdmin}
      />
    </div>
  );
}
