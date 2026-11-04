import { Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SaveContactButton } from "@/components/contacts/save-contact-button";
import { CreateDemoButton } from "@/components/demos/create-demo-button";
import { GenerateMessageButton } from "@/components/messages/generate-message-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBreakdown } from "@/components/ui/score-breakdown";
import { ptPT } from "@/i18n/pt-PT";
import { isLikelyLandline } from "@/lib/radar/results";
import type { ScoredCompany } from "@/lib/radar/search-events";
import type { ServiceId } from "@/lib/radar/types";
import { SiteCheckNote } from "./site-check-note";

const { radar: copy } = ptPT;

export function CompanyDetail({
  scored: { company, opportunity, siteCheck },
  isSample,
  service,
  title,
  saved = false,
  onSaved,
}: {
  scored: ScoredCompany;
  isSample: boolean;
  service: ServiceId;
  title: ReactNode;
  saved?: boolean;
  onSaved?: (companyId: string) => void;
}) {
  const landline = isLikelyLandline(company.phone);
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
      ? ([
          [
            copy.details.phone,
            <span key="phone" className="flex flex-col items-start gap-1">
              <a
                href={`tel:${company.phone.replace(/[^d+]/g, "")}`}
                className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-sm text-accent underline"
              >
                <Phone aria-hidden="true" size={15} />
                {company.phone}
                <span className="sr-only"> · {copy.call}</span>
              </a>
              {landline && (
                <span data-testid="landline-note" className="text-13 text-amber">
                  {copy.landline}
                </span>
              )}
            </span>,
          ],
        ] as [string, ReactNode][])
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
        <div className="flex flex-wrap gap-2 empty:hidden">
          {isSample && <Badge variant="amber">{copy.sampleBadge}</Badge>}
          {saved && <Badge variant="outline">{copy.savedBadge}</Badge>}
        </div>
        {title}
      </div>
      <div className="flex flex-wrap gap-3">
        <GenerateMessageButton
          source={{ kind: "company", id: company.id }}
          companyName={company.name}
          phone={company.phone}
          service={service}
        />
        <CreateDemoButton company={company} isSample={isSample} />
        {saved ? (
          <Button asChild variant="secondary">
            <Link href="/painel/contactos">{copy.openContacts}</Link>
          </Button>
        ) : (
          <SaveContactButton companyId={company.id} onSaved={onSaved} />
        )}
      </div>
      <div className="panel p-5">
        <ScoreBreakdown opportunity={opportunity} />
        <div className="mt-3">
          <SiteCheckNote status={siteCheck} />
        </div>
      </div>
      <div className="panel p-5">
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
