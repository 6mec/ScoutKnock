import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ptPT } from "@/i18n/pt-PT";
import { PLANS } from "@/lib/account/rules";
import { cn } from "@/lib/utils";

const { plans: copy } = ptPT;

export const metadata: Metadata = {
  title: copy.title,
  robots: { index: false },
};

export default function PlansPage() {
  return (
    <div className="mx-auto flex w-full max-w-300 flex-col gap-6 px-4 py-8 lg:px-8">
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
            <p className="text-muted">{copy.priceSoon}</p>
            <dl className="flex flex-col gap-3">
              {(
                [
                  [plan.searches, copy.searches],
                  [plan.demos, copy.demos],
                ] as const
              ).map(([value, label]) => (
                <div key={label} className="flex items-baseline gap-2">
                  <dd className="type-number text-24 font-semibold">{value}</dd>
                  <dt className="text-muted">{label}</dt>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <p className="text-muted">{copy.trial}</p>
    </div>
  );
}
