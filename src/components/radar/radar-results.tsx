"use client";

import { AnimatePresence, LayoutGroup, motion, MotionConfig } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScoreChip } from "@/components/ui/score-chip";
import { ptPT } from "@/i18n/pt-PT";
import { duration, ease } from "@/lib/motion";
import type { ScoredCompany } from "@/lib/radar/search-events";
import type { ScoreLevel, ServiceId } from "@/lib/radar/types";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { CompanyDetail } from "./company-detail";

const { radar: copy } = ptPT;
const FILTERS: ("all" | ScoreLevel)[] = ["all", "strong", "medium", "weak"];
const transition = { duration: duration.fast, ease: ease.out };

export function RadarResults({
  results,
  isSample,
  service,
  onNewSearch,
}: {
  results: ScoredCompany[];
  isSample: boolean;
  service: ServiceId;
  onNewSearch: () => void;
}) {
  const isWide = useMediaQuery("(min-width: 1024px)");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [selectedId, setSelectedId] = useState(results[0]?.company.id);
  const [sheetOpen, setSheetOpen] = useState(false);
  const headingRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => headingRef.current?.focus(), []);

  const visible = results.filter(
    ({ opportunity }) => filter === "all" || opportunity.level === filter,
  );
  // A nota pode mudar com a verificação: a folha aberta não salta para outra empresa.
  const selected =
    visible.find(({ company }) => company.id === selectedId) ??
    (sheetOpen
      ? results.find(({ company }) => company.id === selectedId)
      : undefined) ??
    visible[0];
  const siteChecks = results.filter(({ siteCheck }) => siteCheck);
  const checkingSites = siteChecks.filter(
    ({ siteCheck }) => siteCheck === "checking",
  ).length;

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid flex-1 animate-fade-in lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section
          aria-label={copy.resultsLabel}
          className="flex min-w-0 flex-col border-border bg-background lg:border-r"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 lg:px-8">
            <p
              ref={headingRef}
              tabIndex={-1}
              role="status"
              className="focus-ring rounded-sm text-14 text-muted"
            >
              <span className="type-number font-semibold text-foreground">
                {results.length}
              </span>{" "}
              {results.length === 1 ? copy.countOne : copy.countOther} ·{" "}
              {copy.sorted}
            </p>
            <Button variant="secondary" size="sm" onClick={onNewSearch}>
              {copy.newSearch}
            </Button>
            <p
              role="status"
              data-testid="site-check-summary"
              className="w-full text-13 text-muted empty:hidden"
            >
              {siteChecks.length > 0 &&
                (checkingSites > 0
                  ? copy.siteCheck.summaryChecking(checkingSites)
                  : copy.siteCheck.summaryDone)}
            </p>
            <div
              role="group"
              aria-label={copy.filterLabel}
              className="flex w-full flex-wrap gap-1.5"
            >
              {FILTERS.map((level) => (
                <button
                  key={level}
                  type="button"
                  aria-pressed={filter === level}
                  onClick={() => setFilter(level)}
                  className={cn(
                    "focus-ring min-h-11 rounded-md border border-border px-3 text-14 text-muted transition-colors duration-(--duration-fast) ease-out hovered:text-foreground",
                    filter === level &&
                      "border-border-input bg-surface-raised text-foreground",
                  )}
                >
                  {level === "all" ? copy.filterAll : copy.levels[level]}
                </button>
              ))}
            </div>
          </div>
          {isSample && (
            <p className="border-b border-border px-4 py-3 text-14 text-amber lg:px-8">
              {copy.sampleNotice}
            </p>
          )}
          {visible.length === 0 ? (
            <p className="px-4 py-8 text-muted lg:px-8">{copy.filterEmpty}</p>
          ) : (
            <LayoutGroup>
              <ul>
                <AnimatePresence initial={false} mode="popLayout">
                  {visible.map(({ company, opportunity, siteCheck }) => {
                    const isSelected = isWide && company.id === selected?.company.id;
                    const reason = opportunity.reasons[0];

                    return (
                      <motion.li
                        key={company.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={transition}
                      >
                        <button
                          type="button"
                          aria-current={isSelected || undefined}
                          onClick={() => {
                            setSelectedId(company.id);
                            setSheetOpen(true);
                          }}
                          className={cn(
                            "focus-ring flex min-h-16 w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors duration-(--duration-fast) ease-out hovered:bg-surface lg:px-8",
                            isSelected &&
                              "bg-surface shadow-[inset_3px_0_0_var(--accent)]",
                          )}
                        >
                          <ScoreChip
                            score={opportunity.score}
                            className="w-24 shrink-0 [&>span:first-child]:min-w-12"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">
                              {company.name}
                            </span>
                            <span className="block truncate text-13 text-muted">
                              {company.locality} ·{" "}
                              {reason ? copy.reasons[reason.code] : copy.noReasons}
                            </span>
                            {siteCheck === "checking" && (
                              <span className="block truncate text-13 text-muted">
                                {copy.siteCheck.checking}
                              </span>
                            )}
                          </span>
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </LayoutGroup>
          )}
        </section>

        {isWide
          ? selected && (
              <section
                aria-label={copy.detailLabel}
                className="min-w-0 p-8"
              >
                <CompanyDetail
                  key={selected.company.id}
                  scored={selected}
                  isSample={isSample}
                  service={service}
                  title={
                    <h2 className="type-heading text-32">
                      {selected.company.name}
                    </h2>
                  }
                />
              </section>
            )
          : selected && (
              <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
                <DialogContent
                  aria-describedby={undefined}
                  className="inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none rounded-b-none data-[state=open]:animate-slide-in-bottom"
                >
                  <CompanyDetail
                    scored={selected}
                    isSample={isSample}
                    service={service}
                    title={
                      <DialogTitle className="text-24">
                        {selected.company.name}
                      </DialogTitle>
                    }
                  />
                </DialogContent>
              </Dialog>
            )}
      </div>
    </MotionConfig>
  );
}
