"use client";

import { FileText, Printer } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { observationText } from "@/components/ui/score-breakdown";
import { ptPT } from "@/i18n/pt-PT";
import { diagnosisItems, siteGrade, siteGradeLabel } from "@/lib/outreach/rules";
import type { ScoredCompany } from "@/lib/radar/search-events";

const { outreach: copy, radar: radarCopy } = ptPT;
const dateFormat = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "long",
  timeZone: "Europe/Lisbon",
});

// Página para a empresa: só os motivos observados nesta busca, com o nome de quem a
// prepara. Fica no browser: imprimir ou guardar em PDF, nada se grava.
export function DiagnosisButton({
  scored: { company, opportunity },
  senderName,
}: {
  scored: ScoredCompany;
  senderName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const items = diagnosisItems(opportunity);
  const grade = siteGrade(company);
  const sender = senderName?.trim() || null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" data-testid="diagnosis-open">
          <FileText aria-hidden="true" size={16} />
          {copy.diagnosis.open}
        </Button>
      </DialogTrigger>
      <DialogContent data-print-dialog="" className="max-w-3xl">
        <DialogTitle>{copy.diagnosis.open}</DialogTitle>
        <DialogDescription>
          {copy.diagnosis.intro}
          {!sender && <> {copy.diagnosis.nameHint}</>}
        </DialogDescription>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => window.print()}>
            <Printer aria-hidden="true" size={16} />
            {copy.diagnosis.print}
          </Button>
        </div>
        <article
          data-print-report=""
          data-testid="diagnosis-report"
          className="rounded-md bg-white p-6 text-14 leading-relaxed text-[#0b0f14] sm:p-10 print:rounded-none print:p-0"
        >
          <header className="flex flex-col gap-1 border-b border-[#e3e8ee] pb-5">
            <p className="text-12 font-semibold tracking-wide text-[#566273] uppercase">
              {copy.diagnosis.title}
            </p>
            <h3 className="text-24 font-bold">{copy.diagnosis.for(company.name)}</h3>
            <p className="text-13 text-[#566273]">
              {company.address}
              {" · "}
              {copy.diagnosis.date(dateFormat.format(new Date()))}
              {sender && (
                <>
                  {" · "}
                  {copy.diagnosis.preparedBy(sender)}
                </>
              )}
            </p>
          </header>

          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-[#e3e8ee] p-3">
              <dt className="text-12 text-[#566273]">{copy.siteGrade.label}</dt>
              <dd className="text-20 font-bold">{siteGradeLabel(grade)}</dd>
            </div>
            <div className="rounded-md border border-[#e3e8ee] p-3">
              <dt className="text-12 text-[#566273]">{radarCopy.details.reviews}</dt>
              <dd className="text-20 font-bold">{company.reviewCount ?? radarCopy.details.reviewsUnknown}</dd>
            </div>
            <div className="rounded-md border border-[#e3e8ee] p-3">
              <dt className="text-12 text-[#566273]">{radarCopy.details.hours}</dt>
              <dd className="text-15 font-semibold">
                {company.hasOpeningHours ? radarCopy.details.hoursYes : radarCopy.details.hoursNo}
              </dd>
            </div>
          </dl>

          <h4 className="mt-6 text-16 font-bold">{copy.diagnosis.observed}</h4>
          {items.length === 0 ? (
            <p className="mt-2">{copy.diagnosis.none}</p>
          ) : (
            <ol className="mt-3 flex flex-col gap-3">
              {items.map(({ code, meaning, suggestion }, index) => {
                const observed = opportunity.reasons.find((reason) => reason.code === code)?.observed;
                return (
                  <li key={code} className="rounded-md border border-[#e3e8ee] p-4 break-inside-avoid">
                    <p className="font-semibold">
                      {index + 1}. {radarCopy.reasons[code]}
                    </p>
                    {observed && (
                      <p className="mt-1 text-13 text-[#566273]">{observationText(observed)}</p>
                    )}
                    <p className="mt-2">
                      <span className="font-semibold">{copy.diagnosis.meaning}: </span>
                      {meaning}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold">{copy.diagnosis.suggestion}: </span>
                      {suggestion}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}

          <p className="mt-6 border-t border-[#e3e8ee] pt-4 text-12 text-[#566273]">
            {copy.diagnosis.method}
          </p>
        </article>
      </DialogContent>
    </Dialog>
  );
}
