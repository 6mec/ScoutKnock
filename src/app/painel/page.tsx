import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  Circle,
  ListChecks,
  CreditCard,
  Euro,
  FolderKanban,
  CalendarClock,
  ChartColumn,
  Filter,
  PackageCheck,
  Repeat,
  TrendingUp,
  Wallet,
  FileText,
  History,
  MessagesSquare,
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
import { Funnel } from "@/components/dashboard/funnel";
import { MonthChart } from "@/components/dashboard/month-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { UpcomingList } from "@/components/dashboard/upcoming-list";
import { PlanSubmitButton } from "@/components/plans/plan-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DismissButton, DismissibleArea } from "@/components/dashboard/dismissible";
import { DashboardToday } from "@/components/dashboard/today";
import { portfolioUrl } from "@/lib/portfolio/rules";
import { loadDemoLinks } from "@/lib/demos/load-links";
import { homePortfolioSlug, siteUrl } from "@/lib/site";
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
import { signupsOpen } from "@/lib/personal-mode";
import { todayIn } from "@/lib/demos/booking";
import { projectsSummary, type ClientProject, type ProjectSummaryRow } from "@/lib/projects/rules";
import { billingTasks } from "@/lib/projects/cycle";
import { proposalNumbers } from "@/lib/proposals/rules";
import { PAYMENT_COLUMNS, receivedByMonth, toReceive, type ProjectPayment } from "@/lib/projects/payments";
import {
  deliveredThisMonth,
  funnel,
  FUNNEL_DAYS,
  salesOfMonth,
  upcomingTasks,
  recentActivity,
  responseRate,
  type ActivityItem,
  type UpcomingTask,
} from "@/lib/dashboard/metrics";
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

const ONBOARDING_HIDDEN_KEY = "scoutknock-onboarding-hidden";

export const metadata: Metadata = {
  title: ptPT.app.nav.home,
  robots: { index: false },
};

function Block({
  id,
  title,
  icon,
  className,
  action,
  children,
}: {
  id: string;
  title: string;
  icon: LucideIcon;
  className?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      data-testid={`block-${id}`}
      className={cn("panel flex min-w-0 flex-col gap-4 p-5", className)}
    >
      <PanelHeader id={id} icon={icon} title={title} as="h3" action={action} />
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
  selling,
  lateProjects,
}: {
  data: DashboardData;
  now: number;
  billingOn: boolean;
  selling: boolean;
  lateProjects: { company_name: string }[];
}) {
  const step = nextStep(data, now, { selling, lateProjects });
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
    lateProject: () => {
      if (step.kind !== "lateProject") return ["", null];
      return [copy.next.lateProject(step.name, step.count), action("/painel/projetos", copy.next.openProjects)];
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


type Metrics = {
  sales: ReturnType<typeof salesOfMonth>;
  delivered: ReturnType<typeof deliveredThisMonth>;
  summary: ReturnType<typeof projectsSummary>;
  receive: ReturnType<typeof toReceive>;
  response: ReturnType<typeof responseRate>;
  // null quando as propostas ainda não se podem ler (migração por aplicar).
  proposals: ReturnType<typeof proposalNumbers> | null;
};

// Os números grandes do mês. Só valores escritos nos projetos; sem dados, cada cartão diz
// o que falta em vez de mostrar um zero.
function KpiRow({ metrics }: { metrics: Metrics }) {
  const k = copy.kpis;
  const { sales, delivered, summary, receive, response, proposals } = metrics;
  const euros = (value: number) => money.format(value);

  return (
    <section aria-labelledby="numeros" className="flex flex-col gap-2 lg:col-span-2" data-testid="block-numeros">
      <h3 id="numeros" className="sr-only">
        {k.label}
      </h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          id="vendas"
          label={k.sales}
          icon={TrendingUp}
          value={sales.count > 0 ? euros(sales.amount) : null}
          detail={k.salesDetail(sales.count)}
          empty={k.salesEmpty}
          href="/painel/projetos"
        />
        <StatCard
          id="em-curso"
          label={k.open}
          icon={FolderKanban}
          value={String(summary.open)}
          detail={summary.late.length > 0 ? k.openLate(summary.late.length) : k.openOnTime}
          tone={summary.late.length > 0 ? "danger" : undefined}
          href="/painel/projetos"
        />
        <StatCard
          id="mrr"
          label={k.mrr}
          icon={Repeat}
          value={summary.maintenanceCount > 0 ? `${euros(summary.maintenance)}` : null}
          detail={k.mrrDetail(summary.maintenanceCount)}
          empty={k.mrrEmpty}
          href="/painel/projetos"
        />
        <StatCard
          id="a-receber"
          label={k.toReceive}
          icon={Wallet}
          value={receive.hasPayments ? euros(receive.amount) : null}
          detail={receive.count > 0 ? k.toReceiveDetail(receive.count) : k.toReceiveDone}
          empty={
            <>
              {k.toReceiveNone}. {k.toReceiveNoneHelp}
            </>
          }
          href="/painel/projetos"
        />
        <StatCard
          id="resposta"
          label={k.response}
          icon={MessagesSquare}
          value={response.percent === null ? null : `${response.percent} %`}
          detail={k.responseDetail(response.replied, response.contacted)}
          empty={k.responseEmpty}
          href="/painel/contactos"
        />
        <StatCard
          id="propostas"
          label={k.proposals}
          icon={FileText}
          value={proposals && proposals.openCount > 0 ? String(proposals.openCount) : null}
          detail={proposals ? k.proposalsDetail(euros(proposals.openValue)) : ""}
          empty={k.proposalsEmpty}
          href="/painel/contactos?estado=proposal"
        />
        <StatCard
          id="entregues"
          label={k.delivered}
          icon={PackageCheck}
          value={delivered.count > 0 ? String(delivered.count) : null}
          detail={k.deliveredDetail(euros(delivered.amount))}
          empty={k.deliveredEmpty}
          href="/painel/projetos"
        />
      </div>
      <p className="text-13 text-muted">{k.note}</p>
    </section>
  );
}

function ChartBlock({ data, className }: { data: { month: string; total: number }[]; className?: string }) {
  const empty = data.every((item) => item.total === 0);
  return (
    <Block id="recebido" title={copy.chart.title} icon={ChartColumn} className={className}>
      <p className="-mt-2 text-13 text-muted">{copy.chart.note}</p>
      {empty ? <EmptyLine text={copy.chart.empty} /> : <MonthChart data={data} />}
    </Block>
  );
}

function TasksBlock({ tasks, today, className }: { tasks: UpcomingTask[]; today: string; className?: string }) {
  return (
    <Block id="tarefas" title={copy.tasks.title} icon={CalendarClock} className={className}>
      <UpcomingList tasks={tasks} today={today} />
    </Block>
  );
}

function FunnelBlock({ data, className }: { data: ReturnType<typeof funnel>; className?: string }) {
  return (
    <Block id="funil" title={copy.funnel.title} icon={Filter} className={className}>
      <p className="-mt-2 text-13 text-muted">{copy.funnel.note}</p>
      <Funnel data={data} />
    </Block>
  );
}

const relative = new Intl.RelativeTimeFormat("pt-PT", { numeric: "auto" });
function ago(at: string, now: number) {
  const minutes = Math.round((new Date(at).getTime() - now) / 60_000);
  if (Math.abs(minutes) < 60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relative.format(hours, "hour");
  return relative.format(Math.round(hours / 24), "day");
}

function ActivityBlock({ items, now, className }: { items: ActivityItem[]; now: number; className?: string }) {
  const a = copy.activity;
  return (
    <Block id="atividade" title={a.title} icon={History} className={className}>
      {items.length === 0 ? (
        <EmptyLine text={a.empty} />
      ) : (
        <ul className="flex flex-col divide-y divide-border-subtle" data-testid="activity">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}-${item.at}`}>
              <Link
                href={item.kind === "contact" ? `/painel/contactos?contacto=${item.id}` : `/painel/projetos?projeto=${item.id}`}
                className="focus-ring flex min-h-11 items-start gap-3 rounded-sm py-2.5 transition-colors hovered:text-accent"
              >
                {item.kind === "contact" ? (
                  <Users aria-hidden="true" size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-muted" />
                ) : (
                  <FolderKanban aria-hidden="true" size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-muted" />
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-14 font-medium">{item.title}</span>
                  <span className="truncate text-13 text-muted">
                    {item.kind === "contact"
                      ? a.contact(ptPT.contacts.statuses[item.status as keyof typeof ptPT.contacts.statuses] ?? item.status)
                      : item.created
                        ? a.projectCreated
                        : a.project(ptPT.projects.statuses[item.status as keyof typeof ptPT.projects.statuses] ?? item.status)}
                  </span>
                </span>
                <span className="shrink-0 text-13 text-muted">{ago(item.at, now)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Block>
  );
}

// Desaparece quando está tudo feito; cada passo leva ao sítio onde se faz.
function OnboardingBlock({ progress }: { progress: ReturnType<typeof onboardingProgress> }) {
  if (progress.complete) return null;
  const steps = copy.onboarding.steps;

  // Escondido com "Esconder", fica escondido só neste browser.
  return (
    <DismissibleArea storageKey={ONBOARDING_HIDDEN_KEY} className="flex lg:col-span-2">
    <Block
      id="primeiros-passos"
      title={copy.onboarding.title}
      icon={ListChecks}
      className="flex-1"
      action={<DismissButton storageKey={ONBOARDING_HIDDEN_KEY} label={copy.onboarding.hide} />}
    >
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
    </DismissibleArea>
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
  className,
}: {
  data: DashboardData;
  isSample: boolean;
  className?: string;
}) {
  const { searches_used: used, searches_limit: limit } = data.usage;

  return (
    <Block id="buscas" title={copy.searches.title} icon={Search} className={className}>
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
    <div role="status" aria-label={copy.loading} className="grid gap-4 lg:grid-cols-2">
      <div className="grid grid-cols-2 gap-3 lg:col-span-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-30 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-lg" />
      <Skeleton className="h-72 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
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
  const today = todayIn();
  // O dia de hoje em Lisboa começa no máximo 26 h antes de agora.
  const since = new Date(new Date().getTime() - 26 * 3_600_000).toISOString();
  // O funil olha 90 dias para trás (mais um de folga para o fuso).
  const funnelSince = new Date(new Date().getTime() - (FUNNEL_DAYS + 1) * 86_400_000).toISOString();
  const [{ data, error }, { data: profile }, dealRows, todayEvents, goalRow, templateRow, portfolioRow, isAdmin] =
    await Promise.all([
      supabase.rpc("my_dashboard"),
      supabase.from("profiles").select("locale").eq("id", user.id).maybeSingle(),
      supabase
        .from("contacts")
        .select("*"),
      supabase
        .from("contact_events")
        .select("contact_id, kind, status, created_at")
        .eq("kind", "status")
        .gte("created_at", since),
      supabase.from("profiles").select("daily_goal").eq("id", user.id).maybeSingle(),
      supabase.from("profiles").select("whatsapp_template").eq("id", user.id).maybeSingle(),
      supabase.from("portfolios").select("slug, published").eq("user_id", user.id).maybeSingle(),
      isCurrentUserAdmin(supabase),
    ]);
  // Lidos à parte: sem estas tabelas, o painel continua (o bloco fica vazio).
  const [projectRows, requestRows, paymentRows, funnelRows, proposalRows, recentContactEvents, recentProjectEvents] = await Promise.all([
    supabase
      .from("client_projects")
      .select("id, company_name, name, status, start_date, due_date, delivered_on, maintenance_monthly, maintenance_since, build_value, created_at")
      .limit(500),
    supabase.from("work_requests").select("id", { count: "exact", head: true }),
    supabase.from("client_project_payments").select(PAYMENT_COLUMNS).limit(5000),
    supabase
      .from("contact_events")
      .select("contact_id, status, created_at")
      .eq("kind", "status")
      .gte("created_at", funnelSince)
      .limit(5000),
    supabase.from("proposals").select("status, value, decided_on").limit(2000),
    supabase
      .from("contact_events")
      .select("contact_id, status, created_at")
      .eq("kind", "status")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("client_project_events").select("project_id, kind, status, created_at").order("created_at", { ascending: false }).limit(20),
  ]);
  if (proposalRows.error) await reportError("painel propostas", proposalRows.error.code, user.id);
  if (projectRows.error) await reportError("painel projetos", projectRows.error.code, user.id);
  if (paymentRows.error) await reportError("painel pagamentos", paymentRows.error.code, user.id);
  if (funnelRows.error) await reportError("painel funil", funnelRows.error.code, user.id);

  // Vai para o ecrã de erro do painel, com "Tentar outra vez".
  if (error || !data) {
    await reportError("painel", error?.code ?? "sem dados", user.id);
    throw new Error("painel");
  }

  const dashboard = data as DashboardData;
  const now = new Date().getTime();
  const billingOn = parseBillingConfig(process.env) !== null;
  const isSample = getCompanyProvider({ userId: user.id })?.usesSampleData ?? false;
  // Modo pessoal: sem packs, subscrição nem demos no Início. Esses blocos voltam
  // quando os registos abrirem (SIGNUPS_ENABLED=true).
  const selling = signupsOpen();
  const projects = (projectRows.data ?? []) as (ProjectSummaryRow & Pick<ClientProject, "start_date" | "maintenance_since">)[];
  const payments = (paymentRows.data ?? []) as ProjectPayment[];
  const contacts = (dealRows.data ?? []) as (Contact & { label: string })[];
  const summary = projectsSummary(projects, today);
  const funnelData = funnel((funnelRows.data ?? []) as { contact_id: string; status: string; created_at: string }[], today);
  const metrics: Metrics = {
    sales: salesOfMonth(projects, today),
    delivered: deliveredThisMonth(projects, today),
    summary,
    receive: toReceive(projects, payments),
    response: responseRate(funnelData),
    proposals: proposalRows.error ? null : proposalNumbers((proposalRows.data ?? []) as Parameters<typeof proposalNumbers>[0], today),
  };
  const activity = recentActivity(
    (recentContactEvents.data ?? []) as { contact_id: string; status: string; created_at: string }[],
    (recentProjectEvents.data ?? []) as { project_id: string; kind: string; status: string; created_at: string }[],
    new Map(contacts.map((contact) => [contact.id, contact.label])),
    new Map(projects.map((project) => [project.id, project.company_name])),
  );
  // Se estas leituras falharem, o bloco mostra zeros em vez de partir o painel.
  // O {portfolio} da mensagem do WhatsApp só tem link com o portfólio publicado.
  const portfolioLink = portfolioRow.data?.published
    ? portfolioUrl(portfolioRow.data.slug as string, siteUrl(), homePortfolioSlug())
    : null;
  const deals: Deals = {
    contacts,
    events: (todayEvents.data ?? []) as ContactEvent[],
    goal: (goalRow.data?.daily_goal as number | undefined) ?? DEFAULT_DAILY_GOAL,
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <RefreshOnShow />
      {/* O dia primeiro: a meta, a próxima da fila e as próximas tarefas (retornos e entregas). */}
      <DashboardToday
        contacts={contacts}
        events={deals.events}
        dailyGoal={deals.goal}
        whatsappTemplate={(templateRow.data?.whatsapp_template as string | null | undefined) ?? null}
        portfolioUrl={portfolioLink}
        demoLinks={await loadDemoLinks(supabase, user.id)}
      >
        <TasksBlock
          tasks={upcomingTasks(
            contacts,
            projects,
            today,
            6,
            billingTasks(projects, payments, today).map((task) => ({
              projectId: task.projectId,
              company: task.company,
              detail: copy.tasks.billingDetail(ptPT.projects.payments.kinds[task.label], money.format(task.amount)),
              date: task.date,
              overdue: task.overdue,
            })),
          )}
          today={today}
          className="flex-1"
        />
      </DashboardToday>
      <KpiRow metrics={metrics} />
      <ChartBlock data={receivedByMonth(payments, today)} />
      <FunnelBlock data={funnelData} />
      <ActivityBlock items={activity} now={now} />
      {/* Modo pessoal: "Próximo passo" repetia a fila dos Contactos e as tarefas. */}
      {selling && (
        <NextStepBlock
          data={dashboard}
          now={now}
          billingOn={billingOn}
          selling={selling}
          lateProjects={summary.late}
        />
      )}
      <OnboardingBlock
        progress={onboardingProgress({
          contacts,
          hasTemplate: Boolean(templateRow.data?.whatsapp_template),
          requestsMade: requestRows.count ?? 0,
          projectsMade: projects.length,
          portfolioPublished: Boolean(portfolioRow.data?.published),
        })}
      />
      {selling && <UsageBlock data={dashboard} isAdmin={isAdmin} />}
      {/* Modo pessoal: estes repetiam o funil, os números do mês e as buscas recentes do Radar. */}
      {selling && <LeadsBlock data={dashboard} />}
      {selling && <DealsBlock deals={deals} now={now} />}
      {selling && <SearchesBlock data={dashboard} isSample={isSample} />}
      {selling && <DemosBlock data={dashboard} now={now} />}
      {selling && (
        <SubscriptionBlock
          data={dashboard}
          billingOn={billingOn}
          locale={profile?.locale}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
