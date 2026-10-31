import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanSubmitButton } from "@/components/plans/plan-submit-button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ptPT } from "@/i18n/pt-PT";
import { PLANS } from "@/lib/account/rules";
import { requireUser } from "@/lib/auth/current-user";
import { openBillingPortal, startCheckout } from "@/lib/billing/actions";
import {
  currencyForLocale,
  hasLiveSubscription,
  isPaymentProblem,
  parseBillingConfig,
} from "@/lib/billing/rules";
import { reportError } from "@/lib/events/log";
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
    <Suspense fallback={<Skeleton className="m-4 h-96 rounded-lg lg:m-8" />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({
  searchParams,
}: Pick<PageProps<"/painel/planos">, "searchParams">) {
  const user = await requireUser();
  const supabase = await createClient();
  const { pagamento } = await searchParams;

  const [{ data, error }, { data: profile }] = await Promise.all([
    supabase.rpc("my_plan_usage").maybeSingle(),
    supabase.from("profiles").select("locale").eq("id", user.id).maybeSingle(),
  ]);
  if (error) await reportError("planos uso", error.code, user.id);

  const usage = data as Usage | null;
  // Sem chaves de teste válidas, nada se vende: os preços continuam por anunciar.
  const billingOn = parseBillingConfig(process.env) !== null;
  const currency = currencyForLocale(profile?.locale);
  const money = new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  });
  const live = hasLiveSubscription(usage?.status ?? null);
  const subscribedPlan = live ? usage?.plan : null;

  return (
    <div className="mx-auto flex w-full max-w-300 flex-col gap-6 px-4 py-8 lg:px-8">
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
          className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6"
        >
          <p className="font-semibold">
            {usage.status === "trialing" && usage.trial_end
              ? copy.onTrial(dateFormat.format(new Date(usage.trial_end)))
              : usage.status === "active" && usage.plan
                ? copy.onPlan(copy.names[usage.plan])
                : copy.onLowest}
          </p>
          {usage.status === "active" && usage.cancel_at_period_end && (
            <p className="text-muted">{copy.cancelling}</p>
          )}
          <p data-testid="plan-usage" className="text-muted">
            {copy.usage(
              usage.searches_used,
              usage.searches_limit,
              usage.demos_used,
              usage.demos_limit,
            )}
          </p>
          {billingOn && usage.has_customer && live && (
            <form action={openBillingPortal} className="self-start">
              <PlanSubmitButton variant="secondary">{copy.manage}</PlanSubmitButton>
            </form>
          )}
        </section>
      )}
      <ul className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <li
            key={plan.id}
            className={cn(
              "flex flex-col gap-5 rounded-lg border border-border bg-surface p-6",
              plan.recommended && "border-accent",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="type-heading text-24">{copy.names[plan.id]}</h2>
              {plan.recommended && <Badge variant="accent">{copy.recommended}</Badge>}
            </div>
            <p className="text-muted">
              {billingOn
                ? copy.perMonth(money.format(plan.price[currency]))
                : copy.priceSoon}
            </p>
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
              <form action={startCheckout.bind(null, plan.id)} className="mt-auto">
                <PlanSubmitButton variant={plan.recommended ? "primary" : "secondary"}>
                  {usage?.trial_used ? copy.subscribe : copy.startTrial}
                </PlanSubmitButton>
              </form>
            )}
            {subscribedPlan === plan.id && (
              <p className="mt-auto font-semibold text-accent">{copy.current}</p>
            )}
          </li>
        ))}
      </ul>
      <p className="text-muted">{billingOn ? copy.trialTerms : copy.trial}</p>
    </div>
  );
}
