"use client";

import { ChevronDown, Globe, Phone, PhoneOff, RotateCcw, SlidersHorizontal, Star } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion, MotionConfig } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScoreChip } from "@/components/ui/score-chip";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { saveContact } from "@/lib/contacts/actions";
import { duration, ease } from "@/lib/motion";
import {
  activeFilterCount,
  applyResultFilters,
  DEFAULT_RESULT_FILTERS,
  hasNoOwnSite,
  phoneKind,
  RESULT_FACETS,
  RESULT_SORTS,
  resultStats,
  type ResultFacet,
  type ResultFilters,
} from "@/lib/radar/results";
import type { ScoredCompany } from "@/lib/radar/search-events";
import type { ServiceId } from "@/lib/radar/types";
import { useTheme } from "@/lib/theme";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { CompanyDetail } from "./company-detail";

const { radar: copy } = ptPT;
const SearchRegionMap = dynamic(() => import("./search-region-map"), { ssr: false });
const noop = () => {};
const transition = { duration: duration.fast, ease: ease.out };
const FACETS = Object.keys(RESULT_FACETS) as ResultFacet[];

const facetChip =
  "focus-ring inline-flex min-h-9 items-center rounded-pill border px-3 text-13 transition-colors duration-(--duration-fast) ease-out";
const facetOff = "border-border text-muted hovered:border-accent/40 hovered:text-foreground";
const facetOn = "border-accent/60 bg-accent-soft text-foreground";

export function RadarResults({
  results,
  isSample,
  service,
  onNewSearch,
  savedIds,
  onSaved,
  initialFilters = DEFAULT_RESULT_FILTERS,
  senderName = null,
  source = "google",
  target = null,
}: {
  // Coordenadas da localidade, para o mapa pequeno do fim da busca.
  target?: [number, number] | null;
  source?: "google" | "osm" | "sample";
  results: ScoredCompany[];
  isSample: boolean;
  service: ServiceId;
  onNewSearch: () => void;
  savedIds: ReadonlySet<string>;
  onSaved: (id: string) => void;
  initialFilters?: ResultFilters;
  senderName?: string | null;
}) {
  const isWide = useMediaQuery("(min-width: 1024px)");
  const [filters, setFilters] = useState<ResultFilters>(initialFilters);
  // Aberto no computador; no telemóvel começa fechado para a lista se ver logo.
  const [panelOpen, setPanelOpen] = useState<boolean | null>(null);
  const open = panelOpen ?? isWide;
  const [selectedId, setSelectedId] = useState(results[0]?.company.id);
  const [sheetOpen, setSheetOpen] = useState(false);
  const headingRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => headingRef.current?.focus(), []);

  const visible = applyResultFilters(results, filters, savedIds);
  const active = activeFilterCount(filters);
  const stats = resultStats(results, savedIds);
  // A nota pode mudar com a verificação: a folha aberta não salta para outra empresa.
  const selected =
    visible.find(({ company }) => company.id === selectedId) ??
    (sheetOpen ? results.find(({ company }) => company.id === selectedId) : undefined) ??
    visible[0];
  const siteChecks = results.filter(({ siteCheck }) => siteCheck);
  const checkingSites = siteChecks.filter(({ siteCheck }) => siteCheck === "checking").length;
  const clear = () => setFilters((current) => ({ ...DEFAULT_RESULT_FILTERS, sort: current.sort }));
  const theme = useTheme();
  const [savingAll, startSavingAll] = useTransition();
  const fresh = results.filter(({ company }) => !savedIds.has(company.id));

  // Guarda as novas uma a uma (a mesma ação do botão de cada empresa).
  function saveAllNew() {
    startSavingAll(async () => {
      let saved = 0;
      for (const { company } of fresh) {
        const { ok } = await saveContact(company.id, company.name);
        if (ok) {
          saved += 1;
          onSaved(company.id);
        }
      }
      if (saved === fresh.length) toast.success(copy.savedAll(saved));
      else toast.error(copy.savedAllPartial(saved, fresh.length));
    });
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid flex-1 animate-fade-in lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section
          aria-label={copy.resultsLabel}
          className="flex min-w-0 flex-col border-border bg-background lg:border-r"
        >
          <div className="flex flex-col gap-4 border-b border-border px-4 py-4 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p
                ref={headingRef}
                tabIndex={-1}
                role="status"
                className="focus-ring rounded-sm text-14 text-muted"
              >
                <span className="type-number font-semibold text-foreground">{results.length}</span>{" "}
                {results.length === 1 ? copy.countOne : copy.countOther} ·{" "}
                {copy.sortedBy[filters.sort]}
              </p>
              <div className="flex flex-wrap gap-2">
                {!isSample && fresh.length > 0 && (
                  <Button size="sm" onClick={saveAllNew} loading={savingAll} loadingText={copy.savingAll} data-testid="save-all-new">
                    {copy.saveAllNew(fresh.length)}
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={onNewSearch}>
                  {copy.newSearch}
                </Button>
              </div>
            </div>
            {target && (
              <div role="img" aria-label={copy.resultMapLabel} className="relative h-40 w-full overflow-hidden rounded-md sm:h-48" data-testid="result-map">
                <SearchRegionMap target={target} revealAfterMs={0} companies={results} done theme={theme} onComplete={noop} />
              </div>
            )}

            <dl
              aria-label={copy.stats.label}
              className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-5"
            >
              {(["total", "fresh", "saved", "strong", "noOwnSite"] as const).map((key) => (
                <div
                  key={key}
                  className={cn(
                    "flex flex-col-reverse gap-0.5 bg-surface px-3 py-2",
                    key === "noOwnSite" && "hidden sm:flex",
                  )}
                >
                  <dt className="type-mono truncate text-12 tracking-wide text-muted uppercase">
                    {copy.stats[key]}
                  </dt>
                  <dd
                    data-testid={`stat-${key}`}
                    className={cn(
                      "type-mono text-20 font-semibold",
                      key === "strong" ? "text-accent" : "text-foreground",
                    )}
                  >
                    {stats[key]}
                  </dd>
                </div>
              ))}
            </dl>

            <p
              role="status"
              data-testid="site-check-summary"
              className="text-13 text-muted empty:hidden"
            >
              {siteChecks.length > 0 &&
                (checkingSites > 0
                  ? copy.siteCheck.summaryChecking(checkingSites)
                  : copy.siteCheck.summaryDone)}
            </p>

            <div className="rounded-md border border-border bg-surface/60">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls="radar-facets"
                  data-testid="filters-toggle"
                  onClick={() => setPanelOpen(!open)}
                  className="focus-ring -ml-1 inline-flex min-h-11 items-center gap-2 rounded-sm px-1 text-14 font-semibold"
                >
                  <SlidersHorizontal aria-hidden="true" size={16} className="text-accent" />
                  {copy.filtersTitle}
                  {active > 0 && (
                    <span className="type-mono inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-accent px-1.5 text-12 text-accent-contrast">
                      {active}
                    </span>
                  )}
                  <ChevronDown
                    aria-hidden="true"
                    size={16}
                    className={cn("text-muted transition-transform", open && "rotate-180")}
                  />
                </button>
                <span data-testid="filters-summary" className="text-12 text-muted">
                  {active > 0 ? copy.showing(visible.length, results.length) : copy.filtersFree}
                </span>
                {active > 0 && (
                  <button
                    type="button"
                    onClick={clear}
                    className="focus-ring ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-sm px-1 text-13 text-muted hovered:text-foreground"
                  >
                    <RotateCcw aria-hidden="true" size={14} />
                    {copy.clearFilters}
                  </button>
                )}
              </div>
              {open && (
                <div
                  id="radar-facets"
                  className="grid gap-x-5 gap-y-3 border-t border-border-subtle px-3 py-3 animate-fade-in sm:grid-cols-2"
                >
                  {FACETS.map((facet) => (
                    <FacetGroup
                      key={facet}
                      label={copy.facets[facet]}
                      testId={`facet-${facet}`}
                      options={RESULT_FACETS[facet].map((value) => ({
                        value,
                        label: (copy.facetOptions[facet] as Record<string, string>)[value],
                      }))}
                      value={filters[facet]}
                      onChange={(value) =>
                        setFilters((current) => ({ ...current, [facet]: value }))
                      }
                    />
                  ))}
                  <FacetGroup
                    label={copy.facets.sort}
                    testId="facet-sort"
                    options={RESULT_SORTS.map((value) => ({ value, label: copy.sorts[value] }))}
                    value={filters.sort}
                    onChange={(value) =>
                      setFilters((current) => ({
                        ...current,
                        sort: value as ResultFilters["sort"],
                      }))
                    }
                  />
                </div>
              )}
            </div>
          </div>
          {isSample && (
            <p className="border-b border-border px-4 py-3 text-14 text-amber lg:px-8">
              {copy.sampleNotice}
            </p>
          )}
          {source === "osm" && (
            <p data-testid="osm-list-note" className="border-b border-border px-4 py-3 text-14 text-amber lg:px-8">
              {copy.osmListNote}
            </p>
          )}
          {visible.length === 0 ? (
            <div className="flex flex-col items-start gap-3 px-4 py-8 lg:px-8">
              <p className="text-muted">{copy.filterEmpty}</p>
              <Button variant="secondary" size="sm" onClick={clear}>
                {copy.clearFilters}
              </Button>
            </div>
          ) : (
            <LayoutGroup>
              <ul data-testid="results-list">
                <AnimatePresence initial={false} mode="popLayout">
                  {visible.map((item) => {
                    const { company, opportunity, siteCheck } = item;
                    const isSelected = isWide && company.id === selected?.company.id;
                    const reason = opportunity.reasons[0];
                    const phone = phoneKind(company.phone);
                    const noSite = hasNoOwnSite(item);

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
                            isSelected && "bg-surface shadow-[inset_3px_0_0_var(--accent)]",
                          )}
                        >
                          <ScoreChip
                            score={opportunity.score}
                            className="w-24 shrink-0 [&>span:first-child]:min-w-12"
                          />
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="flex min-w-0 items-center gap-2">
                              <span data-testid="result-name" className="truncate font-semibold">
                                {company.name}
                              </span>
                              {savedIds.has(company.id) && (
                                <Badge variant="outline" data-testid="saved-badge" className="shrink-0">
                                  {copy.savedBadge}
                                </Badge>
                              )}
                            </span>
                            <span className="block truncate text-13 text-muted">
                              {company.locality} ·{" "}
                              {reason ? copy.reasons[reason.code] : copy.noReasons}
                            </span>
                            <span className="flex flex-wrap gap-1.5">
                              <Tag tone={noSite ? "accent" : "muted"} icon={Globe}>
                                {noSite ? copy.tags.noOwnSite : copy.tags.site}
                              </Tag>
                              <Tag
                                tone={phone === "landline" ? "amber" : "muted"}
                                icon={phone === "none" ? PhoneOff : Phone}
                              >
                                {copy.tags.phone[phone]}
                              </Tag>
                              <Tag tone="muted" icon={Star}>
                                {copy.tags.reviews(company.reviewCount)}
                              </Tag>
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
              <section aria-label={copy.detailLabel} className="min-w-0 p-8">
                <div className="lg:sticky lg:top-24">
                  <CompanyDetail
                    key={selected.company.id}
                    scored={selected}
                    isSample={isSample}
                    service={service}
                    saved={savedIds.has(selected.company.id)}
                    onSaved={onSaved}
                    senderName={senderName}
                    source={source}
                    title={<h2 className="type-heading text-32">{selected.company.name}</h2>}
                  />
                </div>
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
                    saved={savedIds.has(selected.company.id)}
                    onSaved={onSaved}
                    senderName={senderName}
                    source={source}
                    title={<DialogTitle className="text-24">{selected.company.name}</DialogTitle>}
                  />
                </DialogContent>
              </Dialog>
            )}
      </div>
    </MotionConfig>
  );
}

function FacetGroup({
  label,
  options,
  value,
  onChange,
  testId,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  testId: string;
}) {
  return (
    <div role="group" aria-label={label} data-testid={testId} className="flex flex-col gap-1.5">
      <span aria-hidden="true" className="type-mono text-12 tracking-wide text-muted uppercase">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(facetChip, value === option.value ? facetOn : facetOff)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Tag({
  tone,
  icon: Icon,
  children,
}: {
  tone: "accent" | "amber" | "muted";
  icon: typeof Globe;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "type-mono inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-12",
        tone === "accent" && "border-accent/30 text-accent",
        tone === "amber" && "border-amber/30 text-amber",
        tone === "muted" && "border-border text-muted",
      )}
    >
      <Icon aria-hidden="true" size={12} />
      {children}
    </span>
  );
}
