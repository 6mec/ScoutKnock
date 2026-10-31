import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { NewSearchLink } from "@/components/app/new-search-link";
import { RefreshOnShow } from "@/components/dashboard/refresh-on-show";
import { RepeatSearchButton } from "@/components/dashboard/repeat-search-button";
import { PlanSubmitButton } from "@/components/plans/plan-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { PLANS } from "@/lib/account/rules";
import { requireUser } from "@/lib/auth/current-user";
import { openBillingPortal } from "@/lib/billing/actions";
import {
  currencyForLocale,
  hasLiveSubscription,
  isPaymentProblem,
  parseBillingConfig,
} from "@/lib/billing/rules";
import { CONTACT_STATUSES } from "@/lib/contacts/rules";
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
  className,
  children,
}: {
  id: string;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      data-testid={`block-${id}`}
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-surface p-5",
        className,
      )}
    >
      <h3 id={id} className="section-label text-muted">
        {title}
      </h3>
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

function UsageBlock({ data }: { data: DashboardData }) {
  const plansLink = (
    <Link href="/painel/planos" className="focus-ring inline-flex min-h-11 items-center rounded-sm text-14 text-accent underline">
      {hasActivePlan(data) ? copy.usage.seePlansUpgrade : copy.usage.seePlans}
    </Link>
  );

  return (
    <Block id="consumo" title={copy.usage.title}>
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
    <Block id="proximo-passo" title={copy.next.title}>
      <p data-testid="next-step" className="type-heading text-20 lg:text-24">
        {text}
      </p>
      {button && <div className="mt-auto flex flex-wrap">{button}</div>}
    </Block>
  );
}

function LeadsBlock({ data }: { data: DashboardData }) {
  return (
    <Block id="contactos" title={copy.leads.title} className="lg:col-span-2">
      {totalLeads(data.leads) === 0 ? (
        <EmptyLine text={copy.leads.empty} />
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {CONTACT_STATUSES.map((status) => (
            <li key={status}>
              <Link
                href={`/painel/contactos?estado=${status}`}
                className="focus-ring flex min-h-11 flex-col gap-1 rounded-md border border-border-subtle p-3 transition-colors duration-(--duration-fast) ease-out hovered:border-accent"
              >
                <span className="type-number text-24 font-semibold">
                  {data.leads[status] ?? 0}
                </span>
                <span className="text-14 text-muted">
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
    <Block id="buscas" title={copy.searches.title}>
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
    <Block id="demos" title={copy.demos.title}>
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
}: {
  data: DashboardData;
  billingOn: boolean;
  locale?: string | null;
}) {
  const { subscription, usage } = data;
  const live = hasLiveSubscription(subscription.status);
  const planName = PLANS.find(({ id }) => id === subscription.plan)
    ? ptPT.plans.names[subscription.plan as (typeof PLANS)[number]["id"]]
    : null;
  const currency = currencyForLocale(locale);
  const money = new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  });

  let state: string = copy.subscription.none;
  if (isPaymentProblem(subscription.status)) {
    state = copy.subscription.paymentProblem(planName ?? "");
  } else if (subscription.status === "trialing") {
    state = copy.subscription.trial(formatDate(subscription.trial_end ?? usage.period_end));
  } else if (subscription.status === "active" && planName) {
    state = subscription.cancel_at_period_end
      ? copy.subscription.ending(planName, formatDate(usage.period_end))
      : copy.subscription.active(planName);
  }

  return (
    <Block id="subscricao" title={copy.subscription.title} className="lg:col-span-2">
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
                className="flex flex-col gap-1 rounded-md border border-border-subtle p-3"
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
      <h2 className="type-heading text-32">{copy.title}</h2>
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
  const [{ data, error }, { data: profile }] = await Promise.all([
    supabase.rpc("my_dashboard"),
    supabase.from("profiles").select("locale").eq("id", user.id).maybeSingle(),
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

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <RefreshOnShow />
      <UsageBlock data={dashboard} />
      <NextStepBlock data={dashboard} now={now} billingOn={billingOn} />
      <LeadsBlock data={dashboard} />
      <SearchesBlock data={dashboard} isSample={isSample} />
      <DemosBlock data={dashboard} now={now} />
      <SubscriptionBlock
        data={dashboard}
        billingOn={billingOn}
        locale={profile?.locale}
      />
    </div>
  );
}
