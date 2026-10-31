import type { ReactNode } from "react";
import { CreateDemoButton } from "@/components/demos/create-demo-button";
import { Badge } from "@/components/ui/badge";
import { ScoreBreakdown } from "@/components/ui/score-breakdown";
import { ptPT } from "@/i18n/pt-PT";
import type { ScoredCompany } from "@/lib/radar/search-events";

const { radar: copy } = ptPT;

export function CompanyDetail({
  scored: { company, opportunity },
  isSample,
  title,
}: {
  scored: ScoredCompany;
  isSample: boolean;
  title: ReactNode;
}) {
  const rows: [string, ReactNode][] = [
    [copy.details.address, company.address],
    [
      copy.details.website,
      company.website ? (
        <a
          href={company.website}
          target="_blank"
          rel="noreferrer noopener"
          className="focus-ring rounded-sm break-all text-accent underline"
        >
          {company.website}
        </a>
      ) : (
        copy.details.noWebsite
      ),
    ],
    ...(company.phone
      ? ([[copy.details.phone, company.phone]] as [string, ReactNode][])
      : []),
    [copy.details.reviews, company.reviewCount],
    [
      copy.details.hours,
      company.hasOpeningHours ? copy.details.hoursYes : copy.details.hoursNo,
    ],
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-start gap-2">
        {isSample && <Badge variant="amber">{copy.sampleBadge}</Badge>}
        {title}
      </div>
      <div className="flex flex-wrap gap-3">
        <CreateDemoButton companyId={company.id} />
      </div>
      <div className="rounded-lg border border-border bg-surface p-5">
        <ScoreBreakdown opportunity={opportunity} />
      </div>
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="text-14 font-bold">{copy.details.title}</h3>
        <dl className="mt-3 flex flex-col gap-3">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-13 text-muted">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
