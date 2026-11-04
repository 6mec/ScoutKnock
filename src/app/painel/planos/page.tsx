import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/app/page-intro";
import { Suspense } from "react";
import { PlanSubmitButton } from "@/components/plans/plan-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { isCurrentUserAdmin } from "@/lib/account/admin";
import { PLANS, YEARLY_PRICES_EUR } from "@/lib/account/rules";
import { requireUser } from "@/lib/auth/current-user";
import { openBillingPortal, startCheckout } from "@/lib/billing/actions";
import {
  currencyForLocale,
  hasLiveSubscription,
  isPaymentProblem,
  missingBillingEnv,
  parseBillingConfig,
  yearlyAvailable,
  type BillingInterval,
} from "@/lib/billing/rules";
import { reportError } from "@/lib/events/log";
import { enabledMarkets } from "@/lib/markets";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const { plans: copy } = ptPT;
const dateFormat = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "long",
  timeZone: "Europe/Lisbon",
});

type Usage = {
  status: string | null;
  plan: (typeof PLANS)[number]["id"] | null;
  trial_used: boolean;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  has_customer: boolean;
  searches_used: number;
  searches_limit: number;
  demos_used: number;
  demos_limit: number;
};

export const metadata: Metadata = {
  title: copy.title,
  robots: { index: false },
};

export default function PlansPage({ searchParams }: PageProps<"/painel/planos">) {
  return (
    <>
      <PageIntro
        title={ptPT.pages.plans.title}
        description={ptPT.pages.plans.description}
        className="mx-auto w-full max-w-300 pt-8"
      />
      <Suspense fallback={<Skeleton className="m-4 h-96 rounded-lg lg:m-8" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Content({
  searchParams,
}: Pick<PageProps<"/painel/planos">, "searchParams">) {
  const user = await requireUser();
  const supabase = await createClient();
  const { pagamento, periodo } = await searchParams;

  const [{ data, error }, { data: profile }, isAdmin] = await Promise.all([
    supabase.rpc("my_plan_usage").maybeSingle(),
    supabase.from("profiles").select("locale").eq("id", user.id).maybeSingle(),
    isCurrentUserAdmin(supabase),
  ]);
  if (error) await reportError("planos uso", error.code, user.id);

  const usage = data as Usage | null;
  // Sem chaves de teste válidas, nada se vende: os preços continuam por anunciar.
  const config = parseBillingConfig(process.env);
  const billingOn = config !== null;
  // O admin vê os packs como vão ficar, com os botões desligados e o que falta ligar.
  const preview = !billingOn && isAdmin;
  const showPrices = billingOn || preview;
  const withYearly = yearlyAvailable(config);
  const interval: BillingInterval = withYearly && periodo === "anual" ? "year" : "month";
  const currency = interval === "year" ? "eur" : currencyForLocale(profile?.locale, enabledMarkets());
  const money = new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  });
  const live = hasLiveSubscription(usage?.status ?? null);
  const subscribedPlan = live ? usage?.plan : null;

  return (
    <div className="mx-auto flex w-full max-w-300 flex-col gap-6 px-4 pt-6 pb-8 lg:px-8">
      {billingOn && (
        <p className="self-start">
          <Badge variant="amber">{copy.testMode}</Badge>
        </p>
      )}
      {pagamento === "erro" && (
        <p role="alert" className="rounded-md border border-danger p-4">
          {copy.checkoutError}
        </p>
      )}
      {pagamento === "sucesso" && (
        <p role="status" className="rounded-md border border-border p-4">
          {copy.checkoutSuccess}
        </p>
      )}
      {usage && isPaymentProblem(usage.status) && (
        <p role="alert" className="rounded-md border border-danger p-4">
          {copy.paymentProblem}
        </p>
      )}
      {usage && (
        <section
          aria-label={copy.usageLabel}
          className="flex flex-col gap-4 panel p-6"
        >
          {isAdmin && (
            <p className="self-start">
              <Badge variant="accent">{copy.admin.badge}</Badge>
            </p>
          )}
          <p data-testid="plan-state" className="font-semibold">
            {isAdmin
              ? copy.admin.state
              : usage.status === "trialing" && usage.trial_end
                ? copy.onTrial(dateFormat.format(new Date(usage.trial_end)))
                : usage.status === "active" && usage.plan
                  ? copy.onPlan(copy.names[usage.plan])
                  : copy.onLowest}
          </p>
          {usage.status === "active" && usage.cancel_at_period_end && (
            <p className="text-muted">{copy.cancelling}</p>
          )}
          <p data-testid="plan-usage" className="text-muted">
            {isAdmin
              ? copy.admin.usage(usage.searches_used, usage.demos_used)
              : copy.usage(
                  usage.searches_used,
                  usage.searches_limit,
                  usage.demos_used,
                  usage.demos_limit,
                )}
          </p>
          {isAdmin && <p className="text-14 text-muted">{copy.admin.note}</p>}
          {billingOn && usage.has_customer && live && (
            <form action={openBillingPortal} className="self-start">
              <PlanSubmitButton variant="secondary">{copy.manage}</PlanSubmitButton>
            </form>
          )}
        </section>
      )}
      {preview && (
        <Callout title={copy.admin.previewTitle}>
          <p>{copy.admin.previewBody}</p>
          <ul data-testid="missing-env" className="mt-2 flex flex-wrap gap-1.5">
            {missingBillingEnv(process.env).map((name) => (
              <li key={name}>
                <code className="type-mono rounded-sm bg-surface px-1.5 py-0.5 text-13">
                  {name}
                </code>
              </li>
            ))}
          </ul>
        </Callout>
      )}
      {withYearly && (
        <nav
          aria-label={copy.intervals.label}
          className="inline-flex self-start rounded-md border border-border bg-surface p-1"
        >
          {(["month", "year"] as const).map((value) => (
            <Link
              key={value}
              href={value === "year" ? "/painel/planos?periodo=anual" : "/painel/planos"}
              aria-current={interval === value ? "page" : undefined}
              replace
              scroll={false}
              className={cn(
                "focus-ring inline-flex min-h-11 items-center rounded-sm px-4 text-14 font-semibold text-muted transition-colors duration-(--duration-fast) hovered:text-foreground",
                interval === value && "bg-surface-raised text-foreground shadow-sm",
              )}
            >
              {copy.intervals[value]}
            </Link>
          ))}
        </nav>
      )}
      <ul className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const yearly = YEARLY_PRICES_EUR[plan.id];
          const saving = yearly === null ? 0 : plan.price.eur * 12 - yearly;

          return (
            <li
              key={plan.id}
              data-testid={`plan-${plan.id}`}
              className={cn(
                "flex flex-col gap-5 panel p-6",
                plan.recommended && "border-accent",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="type-heading text-24">{copy.names[plan.id]}</h3>
                {plan.recommended && <Badge variant="accent">{copy.recommended}</Badge>}
              </div>
              <div className="flex flex-col gap-1">
                <p className={cn(showPrices ? "font-semibold" : "text-muted")}>
                  {!showPrices
                    ? copy.priceSoon
                    : preview
                      ? copy.admin.previewPrice(money.format(plan.price.eur))
                      : interval === "year" && yearly !== null
                        ? copy.perYear(money.format(yearly))
                        : copy.perMonth(money.format(plan.price[currency]))}
                </p>
                {interval === "year" && yearly !== null && (
                  <>
                    <p className="text-14 text-muted">
                      {copy.perYearMonthly(money.format(yearly / 12))}
                    </p>
                    {saving > 0 && (
                      <p className="text-14 text-accent">
                        {copy.yearlySaving(money.format(saving))}
                      </p>
                    )}
                  </>
                )}
              </div>
              <dl className="flex flex-col gap-3">
                {(
                  [
                    [plan.searches, copy.searches],
                    [plan.demos, copy.demos],
                    [plan.monthlyLookups, copy.lookups(plan.lookups)],
                  ] as const
                ).map(([value, label]) => (
                  <div key={label} className="flex items-baseline gap-2">
                    <dd className="type-number text-24 font-semibold">{value}</dd>
                    <dt className="text-muted">{label}</dt>
                  </div>
                ))}
              </dl>
              {billingOn && !live && (
                <form
                  action={startCheckout.bind(null, plan.id, interval)}
                  className="mt-auto"
                >
                  <PlanSubmitButton variant={plan.recommended ? "primary" : "secondary"}>
                    {usage?.trial_used ? copy.subscribe : copy.startTrial}
                  </PlanSubmitButton>
                </form>
              )}
              {preview && (
                <Button
                  disabled
                  variant={plan.recommended ? "primary" : "secondary"}
                  className="mt-auto"
                >
                  {copy.admin.previewButton}
                </Button>
              )}
              {subscribedPlan === plan.id && (
                <p className="mt-auto font-semibold text-accent">{copy.current}</p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-muted">{copy.included}</p>
      {interval === "year" && <p className="text-muted">{copy.yearlyLimits}</p>}
      <p className="text-muted">{billingOn ? copy.trialTerms : copy.trial}</p>
    </div>
  );
}
