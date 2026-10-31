import type { Metadata } from "next";
import { Suspense } from "react";
import { ptPT } from "@/i18n/pt-PT";
import { requireUser } from "@/lib/auth/current-user";
import { getCompanyProvider } from "@/lib/radar/provider";
import { scoreCompany } from "@/lib/radar/score";
import {
  SERVICE_IDS,
  type Company,
  type Opportunity,
  type ScoreLevel,
  type ServiceId,
} from "@/lib/radar/types";

const { radar: copy } = ptPT;

export const metadata: Metadata = {
  title: copy.title,
  robots: { index: false },
};

const MAX_FILTER_LENGTH = 80;
const inputClass =
  "h-12 w-full rounded-[12px] border border-border bg-background px-3 text-[16px] outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent";
const levelClass: Record<ScoreLevel, string> = {
  strong: "text-accent",
  medium: "text-amber",
  weak: "text-muted",
};

export default function RadarPage({ searchParams }: PageProps<"/painel/radar">) {
  return (
    <div className="flex flex-1 w-full max-w-3xl mx-auto flex-col gap-8 px-4 py-12">
      <Suspense fallback={<p className="text-muted">{copy.loading}</p>}>
        <RadarContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function filter(value: string | string[] | undefined) {
  return typeof value === "string"
    ? value.trim().slice(0, MAX_FILTER_LENGTH)
    : "";
}

async function RadarContent({
  searchParams,
}: Pick<PageProps<"/painel/radar">, "searchParams">) {
  await requireUser();

  const provider = getCompanyProvider();
  if (!provider) {
    return <p className="leading-[1.6]">{copy.unavailable}</p>;
  }

  const params = await searchParams;
  const niche = filter(params.niche);
  const locality = filter(params.locality);
  const service = SERVICE_IDS.find((id) => id === params.service);
  const hasQuery = Boolean(service && niche && locality);

  return (
    <>
      {provider.usesSampleData && (
        <p className="rounded-[12px] border border-amber p-4 text-amber">
          {copy.sampleNotice}
        </p>
      )}
      <form
        action="/painel/radar"
        className="flex flex-col gap-4 rounded-[12px] border border-border bg-surface p-6"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="service" className="font-bold">
            {copy.serviceLabel}
          </label>
          <select
            id="service"
            name="service"
            defaultValue={service ?? SERVICE_IDS[0]}
            className={inputClass}
          >
            {SERVICE_IDS.map((id) => (
              <option key={id} value={id}>
                {copy.services[id]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="niche" className="font-bold">
              {copy.nicheLabel}
            </label>
            <input
              id="niche"
              name="niche"
              defaultValue={niche}
              placeholder={copy.nichePlaceholder}
              maxLength={MAX_FILTER_LENGTH}
              required
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="locality" className="font-bold">
              {copy.localityLabel}
            </label>
            <input
              id="locality"
              name="locality"
              defaultValue={locality}
              placeholder={copy.localityPlaceholder}
              maxLength={MAX_FILTER_LENGTH}
              required
              className={inputClass}
            />
          </div>
        </div>
        <button
          type="submit"
          className="h-12 rounded-[12px] bg-accent px-5 font-bold text-accent-contrast transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {copy.submit}
        </button>
      </form>
      {service && hasQuery ? (
        <Results
          service={service}
          companies={await provider.search({ service, niche, locality })}
          isSample={provider.usesSampleData}
        />
      ) : (
        <p className="leading-[1.6] text-muted">{copy.empty}</p>
      )}
    </>
  );
}

function Results({
  service,
  companies,
  isSample,
}: {
  service: ServiceId;
  companies: Company[];
  isSample: boolean;
}) {
  if (companies.length === 0) {
    return <p className="leading-[1.6]">{copy.noResults}</p>;
  }

  const results = companies
    .map((company) => ({
      company,
      opportunity: scoreCompany(company, service),
    }))
    .sort((a, b) => b.opportunity.score - a.opportunity.score);

  return (
    <ul className="flex flex-col gap-4">
      {results.map(({ company, opportunity }) => (
        <CompanyCard
          key={company.id}
          company={company}
          opportunity={opportunity}
          isSample={isSample}
        />
      ))}
    </ul>
  );
}

function CompanyCard({
  company,
  opportunity,
  isSample,
}: {
  company: Company;
  opportunity: Opportunity;
  isSample: boolean;
}) {
  return (
    <li className="flex flex-col gap-4 rounded-[12px] border border-border bg-surface p-6">
      {isSample && (
        <p className="text-[16px] sm:text-[14px] font-bold text-amber">
          {copy.sampleBadge}
        </p>
      )}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="text-[20px] font-bold tracking-tight">{company.name}</h2>
        <p className={levelClass[opportunity.level]}>
          {copy.scoreLabel}:{" "}
          <span className="font-mono font-bold">{opportunity.score}/100</span> (
          {copy.levels[opportunity.level]})
        </p>
      </div>
      <p className="text-muted">{company.address}</p>
      <div className="flex flex-col gap-2">
        <h3 className="font-bold">{copy.reasonsLabel}</h3>
        {opportunity.reasons.length === 0 ? (
          <p className="text-muted">{copy.noReasons}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {opportunity.reasons.map((reason) => (
              <li key={reason.code} className="flex justify-between gap-4">
                <span>{copy.reasons[reason.code]}</span>
                <span className="font-mono text-muted">+{reason.points}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
