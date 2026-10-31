"use client";

import { useRouter } from "next/navigation";
import { useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ptPT } from "@/i18n/pt-PT";
import { findLocation } from "@/lib/radar/localities";
import { newSearchRequests, subscribeToNewSearch } from "@/lib/radar/new-search";
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
  | { type: "event"; event: SearchEvent };

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
        ].sort((a, b) => b.opportunity.score - a.opportunity.score),
      };
    case "done":
      return { ...state, phase: "results" };
    case "error":
      return { ...state, phase: "error", error: event.code };
  }
}

export function RadarScreen({ isSample }: { isSample: boolean }) {
  const requests = useSyncExternalStore(
    subscribeToNewSearch,
    newSearchRequests,
    () => 0,
  );

  return <RadarSearch key={requests} isSample={isSample} />;
}

function RadarSearch({ isSample }: { isSample: boolean }) {
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

  async function search() {
    const controller = new AbortController();
    controllerRef.current = controller;
    dispatch({ type: "start" });

    const fail = (code: SearchErrorCode) =>
      dispatch({ type: "event", event: { type: "error", code } });

    try {
      const response = await fetch("/api/radar/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: controller.signal,
      });

      if (response.status === 401) {
        router.push("/entrar");
        return;
      }
      if (response.status === 503) return fail("unavailable");
      if (!response.ok || !response.body) return fail("provider");

      let finished = false;
      await readSearchEvents(response.body, (event) => {
        finished ||= event.type === "done" || event.type === "error";
        dispatch({ type: "event", event });
      });

      // A ligação fechou sem o servidor dizer que terminou.
      if (!finished) fail("provider");
    } catch {
      if (controller.signal.aborted) {
        dispatch({ type: "reset" });
        return;
      }
      fail(navigator.onLine ? "provider" : "offline");
    }
  }

  const reset = () => dispatch({ type: "reset" });

  if (state.phase === "results" && state.companies.length > 0) {
    return (
      <RadarResults
        results={state.companies}
        isSample={isSample}
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
            onSubmit={search}
            focusOnMount={state.returning}
          />
        )}
        {searching && (
          <SearchProgress
            steps={state.steps}
            companies={state.companies}
            onCancel={() => controllerRef.current?.abort()}
          />
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
              {state.error !== "limit" && state.error !== "unavailable" && (
                <Button onClick={search}>{copy.retry}</Button>
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
        target={findLocation(values.locality)}
      />
    </div>
  );
}
