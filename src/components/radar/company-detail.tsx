import type { ReactNode } from "react";
import { SaveContactButton } from "@/components/contacts/save-contact-button";
import { CreateDemoButton } from "@/components/demos/create-demo-button";
import { GenerateMessageButton } from "@/components/messages/generate-message-button";
import { Badge } from "@/components/ui/badge";
import { ScoreBreakdown } from "@/components/ui/score-breakdown";
import { ptPT } from "@/i18n/pt-PT";
import type { ScoredCompany } from "@/lib/radar/search-events";
import { SiteCheckNote } from "./site-check-note";

const { radar: copy } = ptPT;

export function CompanyDetail({
  scored: { company, opportunity, siteCheck },
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
        <GenerateMessageButton
          source={{ kind: "company", id: company.id }}
          companyName={company.name}
          phone={company.phone}
        />
        <CreateDemoButton company={company} isSample={isSample} />
        <SaveContactButton companyId={company.id} />
      </div>
      <div className="rounded-lg border border-border bg-surface p-5">
        <ScoreBreakdown opportunity={opportunity} />
        <div className="mt-3">
          <SiteCheckNote status={siteCheck} />
        </div>
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
        {!isSample && (
          <p className="mt-3 text-13 text-muted">{copy.attribution}</p>
        )}
      </div>
    </div>
  );
}
