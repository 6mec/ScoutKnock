"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { EmptyState } from "@/components/ui/empty-state";
import { ptPT } from "@/i18n/pt-PT";
import type { Market } from "@/lib/markets";
import { findLocation } from "@/lib/radar/localities";
import { hasSampleCompanies } from "@/lib/radar/sample-companies";
import { newSearchRequests, subscribeToNewSearch,
  takePendingSearch,
} from "@/lib/radar/new-search";
import {
  readSearchEvents,
  type ScoredCompany,
  type SearchErrorCode,
  type SearchEvent,
  type SearchStep,
} from "@/lib/radar/search-events";
import { SERVICE_IDS, type SearchQuery } from "@/lib/radar/types";
import { RadarForm } from "./radar-form";
import { ManualSearchActions } from "./manual-search";
import { RadarResults } from "./radar-results";
import { RadarStage } from "./radar-stage";
import { SearchProgress, type StepStatus } from "./search-progress";

const { radar: copy } = ptPT;

type State = {
  phase: "idle" | "searching" | "results" | "error";
  steps: Record<SearchStep, StepStatus>;
  companies: ScoredCompany[];
  error?: SearchErrorCode;
  returning: boolean;
};

type Action =
  | { type: "start" }
  | { type: "reset" }
  | { type: "sitesInterrupted" }
  | { type: "event"; event: SearchEvent };

const byScore = (a: ScoredCompany, b: ScoredCompany) =>
  b.opportunity.score - a.opportunity.score;

const initialState: State = {
  phase: "idle",
  steps: { reading: "waiting", scoring: "waiting" },
  companies: [],
  returning: false,
};

function reducer(state: State, action: Action): State {
  if (action.type === "start") {
    return { ...initialState, phase: "searching" };
  }
  if (action.type === "reset") return { ...initialState, returning: true };
  if (action.type === "sitesInterrupted") {
    return {
      ...state,
      companies: state.companies
        .map((item) =>
          item.siteCheck === "checking"
            ? { ...item, siteCheck: "failed" as const }
            : item,
        )
        .sort(byScore),
    };
  }

  const { event } = action;
  switch (event.type) {
    case "step":
      return {
        ...state,
        steps: { ...state.steps, [event.step]: event.status },
      };
    case "company":
      return {
        ...state,
        companies: [
          ...state.companies,
          { company: event.company, opportunity: event.opportunity },
        ].sort(byScore),
      };
    case "done":
      return { ...state, phase: "results" };
    case "error":
      return { ...state, phase: "error", error: event.code };
    case "sites_start":
      return {
        ...state,
        companies: state.companies.map((item) => {
          if (event.checking.includes(item.company.id)) {
            return { ...item, siteCheck: "checking" as const };
          }
          return event.skipped.includes(item.company.id)
            ? { ...item, siteCheck: "skipped" as const }
            : item;
        }),
      };
    // A nota muda no sítio: a lista só se reordena no fim, para não fugir debaixo do dedo.
    case "site":
      return {
        ...state,
        companies: state.companies.map((item) => {
          if (item.company.id !== event.id) return item;
          return event.status === "checked"
            ? {
                company: { ...item.company, site: event.site },
                opportunity: event.opportunity,
                siteCheck: "checked" as const,
              }
            : { ...item, siteCheck: "failed" as const };
        }),
      };
    case "sites_done":
      return { ...state, companies: [...state.companies].sort(byScore) };
  }
}

export type SearchUsage = { used: number; limit: number };

export function RadarScreen({
  isSample,
  markets,
  usage: initialUsage,
  isAdmin,
  savedIds: initialSavedIds,
}: {
  isSample: boolean;
  markets: Market[];
  usage: SearchUsage | null;
  isAdmin: boolean;
  savedIds: string[];
}) {
  const requests = useSyncExternalStore(
    subscribeToNewSearch,
    newSearchRequests,
    () => 0,
  );
  // Ficam por cima da busca: "Nova busca" recomeça a busca, mas não estes números.
  const [usage, setUsage] = useState(initialUsage);
  const [savedIds, setSavedIds] = useState(() => new Set(initialSavedIds));
  const onSearchCounted = useCallback(
    () => setUsage((current) => current && { ...current, used: current.used + 1 }),
    [],
  );
  const onSaved = useCallback(
    (id: string) => setSavedIds((current) => new Set(current).add(id)),
    [],
  );

  return (
    <RadarSearch
      key={requests}
      isSample={isSample}
      markets={markets}
      usage={usage}
      isAdmin={isAdmin}
      savedIds={savedIds}
      onSearchCounted={onSearchCounted}
      onSaved={onSaved}
    />
  );
}

function RadarSearch({
  isSample,
  markets,
  usage,
  isAdmin,
  savedIds,
  onSearchCounted,
  onSaved,
}: {
  isSample: boolean;
  markets: Market[];
  usage: SearchUsage | null;
  isAdmin: boolean;
  savedIds: ReadonlySet<string>;
  onSearchCounted: () => void;
  onSaved: (id: string) => void;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);
  // Os resultados esperam que o último pino caia no mapa da busca.
  const [mapDone, setMapDone] = useState(false);
  const [values, setValues] = useState<SearchQuery>({
    service: SERVICE_IDS[0],
    niche: "",
    locality: "",
  });
  const controllerRef = useRef<AbortController | null>(null);

  // Ao sair do ecrã a meio, o pedido para e o formulário volta.
  useEffect(
    () => () => {
      controllerRef.current?.abort();
    },
    [],
  );

  // Adiado um instante: em desenvolvimento, o React corre os efeitos duas vezes, e o
  // primeiro é cancelado antes de a busca começar, sem a gastar.
  useEffect(() => {
    const timer = setTimeout(() => {
      const repeated = takePendingSearch();
      if (repeated) {
        setValues(repeated);
        search(repeated);
      }
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search(query: SearchQuery = values) {
    const controller = new AbortController();
    controllerRef.current = controller;
    setMapDone(false);
    dispatch({ type: "start" });

    const fail = (code: SearchErrorCode) =>
      dispatch({ type: "event", event: { type: "error", code } });
    let finished = false;

    try {
      const response = await fetch("/api/radar/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
        signal: controller.signal,
      });

      if (response.status === 401) {
        router.push("/entrar");
        return;
      }
      if (response.status === 503) return fail("unavailable");
      if (response.status === 429) return fail("limit");
      if (response.status === 422) return fail("locality");
      if (!response.ok || !response.body) return fail("provider");
      // Só uma resposta aceite gasta uma busca do limite.
      onSearchCounted();

      await readSearchEvents(response.body, (event) => {
        finished ||= event.type === "done" || event.type === "error";
        dispatch({ type: "event", event });
      });

      // A ligação fechou sem o servidor dizer que terminou.
      if (!finished) fail("provider");
      else dispatch({ type: "sitesInterrupted" });
    } catch {
      // Os resultados já chegaram: só a verificação dos sites ficou a meio.
      if (finished) {
        if (!controller.signal.aborted) dispatch({ type: "sitesInterrupted" });
        return;
      }
      if (controller.signal.aborted) {
        dispatch({ type: "reset" });
        return;
      }
      fail(navigator.onLine ? "provider" : "offline");
    }
  }

  const reset = () => {
    controllerRef.current?.abort();
    dispatch({ type: "reset" });
  };

  const found = state.phase === "results" && state.companies.length > 0;
  const target = findLocation(values.locality, markets);

  // Sem coordenadas da localidade não há mapa, e os resultados aparecem logo.
  if (found && (mapDone || !target)) {
    return (
      <RadarResults
        results={state.companies}
        isSample={isSample}
        service={values.service}
        onNewSearch={reset}
        savedIds={savedIds}
        onSaved={onSaved}
      />
    );
  }

  const searching = state.phase === "searching" || found;

  return (
    <div className="mx-auto grid w-full max-w-300 flex-1 grid-cols-[minmax(0,1fr)] items-center gap-8 px-4 py-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:px-8">
      <div key={state.phase} className="flex animate-fade-in flex-col gap-4">
        {isSample && (
          <Callout tone="amber">{copy.sampleNotice}</Callout>
        )}
        {state.phase === "idle" && (
          <RadarForm
            values={values}
            onChange={setValues}
            onSubmit={() => search()}
            focusOnMount={state.returning}
            markets={markets}
            usage={usage}
            isAdmin={isAdmin}
          />
        )}
        {state.phase === "idle" && (
          <ManualSearchActions niche={values.niche} locality={values.locality} />
        )}
        {searching && (
          <SearchProgress
            steps={state.steps}
            companies={state.companies}
            // Com os resultados já chegados, cancelar só salta o resto da animação.
            onCancel={() => (found ? setMapDone(true) : controllerRef.current?.abort())}
          />
        )}
        {state.phase === "results" &&
          !found &&
          isSample &&
          !hasSampleCompanies(values.locality) && (
            <Callout role="status" tone="amber">
              {copy.sampleOnlyIn}
            </Callout>
          )}
        {state.phase === "results" && !found && (
          <EmptyState
            title={copy.noResults}
            action={
              <Button variant="secondary" onClick={reset}>
                {copy.back}
              </Button>
            }
            className="bg-surface"
          />
        )}
        {state.phase === "error" && state.error && (
          <div
            role="alert"
            className="flex flex-col items-start gap-4 panel p-6"
          >
            <p className="type-body">{copy.errors[state.error]}</p>
            <div className="flex flex-wrap gap-3">
              {state.error === "limit" && (
                <Button asChild>
                  <Link href="/painel/planos">{copy.seePlans}</Link>
                </Button>
              )}
              {state.error !== "limit" &&
                state.error !== "unavailable" &&
                state.error !== "locality" && (
                <Button onClick={() => search()}>{copy.retry}</Button>
              )}
              <Button variant="secondary" onClick={reset}>
                {copy.back}
              </Button>
            </div>
          </div>
        )}
      </div>
      <RadarStage
        // No telemóvel, o mapa da busca fica por cima da lista para se ver.
        className={searching ? "order-first lg:order-none" : undefined}
        searching={searching}
        target={target}
        isSample={isSample}
        companies={state.companies}
        done={state.phase !== "searching"}
        onMapComplete={() => setMapDone(true)}
      />
    </div>
  );
}
