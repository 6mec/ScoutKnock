"use client";

import { useRouter } from "next/navigation";
import { useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
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

export function RadarScreen({
  isSample,
  markets,
}: {
  isSample: boolean;
  markets: Market[];
}) {
  const requests = useSyncExternalStore(
    subscribeToNewSearch,
    newSearchRequests,
    () => 0,
  );

  return <RadarSearch key={requests} isSample={isSample} markets={markets} />;
}

function RadarSearch({
  isSample,
  markets,
}: {
  isSample: boolean;
  markets: Market[];
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);
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

  if (state.phase === "results" && state.companies.length > 0) {
    return (
      <RadarResults
        results={state.companies}
        isSample={isSample}
        service={values.service}
        onNewSearch={reset}
      />
    );
  }

  const searching = state.phase === "searching";

  return (
    <div className="mx-auto grid w-full max-w-300 flex-1 items-center gap-8 px-4 py-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:px-8">
      <div key={state.phase} className="flex animate-fade-in flex-col gap-4">
        {isSample && (
          <p className="rounded-md border border-amber px-4 py-3 text-14 text-amber">
            {copy.sampleNotice}
          </p>
        )}
        {state.phase === "idle" && (
          <RadarForm
            values={values}
            onChange={setValues}
            onSubmit={() => search()}
            focusOnMount={state.returning}
            markets={markets}
          />
        )}
        {searching && (
          <SearchProgress
            steps={state.steps}
            companies={state.companies}
            onCancel={() => controllerRef.current?.abort()}
          />
        )}
        {state.phase === "results" &&
          isSample &&
          !hasSampleCompanies(values.locality) && (
            <p
              role="status"
              className="rounded-md border border-amber px-4 py-3 text-14 text-amber"
            >
              {copy.sampleOnlyIn}
            </p>
          )}
        {state.phase === "results" && (
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
            className="flex flex-col items-start gap-4 rounded-lg border border-border bg-surface p-6"
          >
            <p className="type-body">{copy.errors[state.error]}</p>
            <div className="flex flex-wrap gap-3">
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
        searching={searching}
        target={findLocation(values.locality, markets)}
      />
    </div>
  );
}
