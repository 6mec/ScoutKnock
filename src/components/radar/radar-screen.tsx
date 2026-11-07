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
import { findLocation, resolveLocality } from "@/lib/radar/localities";
import { filtersFromPre, type PreFilter } from "@/lib/radar/results";
import { hasSampleCompanies } from "@/lib/radar/sample-companies";
import type { OsmElement } from "@/lib/radar/osm";
import { osmSearchKey, readCachedSearch, writeCachedSearch } from "@/lib/radar/osm-search-cache";
import { searchOverpass, type OverpassFailure, type OverpassProgress } from "@/lib/radar/overpass-client";
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
import { RadarConsole } from "./radar-console";
import { RadarForm } from "./radar-form";
import { ManualSearchActions } from "./manual-search";
import { RadarResults } from "./radar-results";
import { RadarStage } from "./radar-stage";
import { SearchProgress, type StepStatus } from "./search-progress";

const { radar: copy } = ptPT;

type OsmStatus = { part: number; parts: number; server: number; servers: number; waiting: number | null };

type State = {
  phase: "idle" | "searching" | "results" | "error";
  steps: Record<SearchStep, StepStatus>;
  companies: ScoredCompany[];
  error?: SearchErrorCode;
  returning: boolean;
  // Só na busca do OpenStreetMap feita no browser.
  osm: OsmStatus | null;
  startedAt: number | null;
  partial: boolean;
  // Há quantos minutos o Overpass deu estes dados, quando vêm da memória do browser.
  cachedMinutes: number | null;
};

type Action =
  | { type: "start"; at: number }
  | { type: "reset" }
  | { type: "sitesInterrupted" }
  | { type: "osm"; progress: OverpassProgress | null }
  | { type: "partial" }
  | { type: "cached"; minutes: number }
  | { type: "event"; event: SearchEvent };

const byScore = (a: ScoredCompany, b: ScoredCompany) =>
  b.opportunity.score - a.opportunity.score;

const initialState: State = {
  phase: "idle",
  steps: { reading: "waiting", scoring: "waiting" },
  companies: [],
  returning: false,
  osm: null,
  startedAt: null,
  partial: false,
  cachedMinutes: null,
};

const NEW_OSM: OsmStatus = { part: 1, parts: 1, server: 1, servers: 1, waiting: null };

function osmStatus(current: OsmStatus | null, progress: OverpassProgress): OsmStatus {
  const base = current ?? NEW_OSM;
  if (progress.type === "part") return { ...base, part: progress.part, parts: progress.parts, waiting: null };
  if (progress.type === "server") return { ...base, server: progress.server, servers: progress.servers, waiting: null };
  return { ...base, waiting: progress.seconds };
}

function osmLabel(status: OsmStatus | null) {
  if (!status) return null;
  const now =
    status.waiting !== null
      ? copy.osm.waiting(status.waiting)
      : status.server > 1
        ? copy.osm.otherServer(status.server, status.servers)
        : copy.osm.asking;
  return status.parts > 1 ? `${copy.osm.part(status.part, status.parts)} · ${now}` : now;
}

const FAILURE_CODES: Record<OverpassFailure, SearchErrorCode> = {
  busy: "busy",
  timeout: "timeout",
  offline: "offline",
  rejected: "provider",
};

function reducer(state: State, action: Action): State {
  if (action.type === "start") {
    return { ...initialState, phase: "searching", startedAt: action.at };
  }
  if (action.type === "osm") {
    return { ...state, osm: action.progress && osmStatus(state.osm, action.progress) };
  }
  if (action.type === "partial") return { ...state, partial: true };
  if (action.type === "cached") return { ...state, cachedMinutes: action.minutes };
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
  senderName = null,
  source = "google",
}: {
  source?: "google" | "osm" | "sample";
  isSample: boolean;
  markets: Market[];
  usage: SearchUsage | null;
  isAdmin: boolean;
  savedIds: string[];
  senderName?: string | null;
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
      senderName={senderName}
      source={source}
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
  senderName,
  source,
}: {
  source: "google" | "osm" | "sample";
  isSample: boolean;
  markets: Market[];
  usage: SearchUsage | null;
  isAdmin: boolean;
  savedIds: ReadonlySet<string>;
  onSearchCounted: () => void;
  onSaved: (id: string) => void;
  senderName: string | null;
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
  // Ficam de uma busca para a outra, como o formulário.
  const [preFilters, setPreFilters] = useState<PreFilter[]>([]);
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

  async function search(query: SearchQuery = values, { refresh = false } = {}) {
    const controller = new AbortController();
    controllerRef.current = controller;
    setMapDone(false);
    dispatch({ type: "start", at: Date.now() });

    const fail = (code: SearchErrorCode) =>
      dispatch({ type: "event", event: { type: "error", code } });
    // Recusas do servidor; devolve true se a busca acabou aqui.
    const refused = (response: Response) => {
      if (response.status === 401) {
        router.push("/entrar");
        return true;
      }
      if (response.status === 503) fail("unavailable");
      else if (response.status === 429) fail("limit");
      else if (response.status === 422) fail("locality");
      else if (!response.ok) fail("provider");
      return !response.ok;
    };
    const post = (url: string, body: unknown) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

    // OpenStreetMap: os pedidos ao Overpass saem do browser (podem passar o tempo de uma
    // função do servidor). O servidor conta a busca antes e valida os dados depois.
    async function osmSearch(): Promise<Response | null> {
      const key = osmSearchKey(query.niche, query.locality);
      const cached = refresh ? null : readCachedSearch(key);
      let elements: OsmElement[];
      if (cached) {
        elements = cached.elements;
        dispatch({ type: "cached", minutes: Math.floor((Date.now() - cached.at) / 60_000) });
      } else {
        const start = await post("/api/radar/osm/start", query);
        if (refused(start)) return null;
        const { parts, counted } = (await start.json()) as { parts: string[]; counted: boolean };
        if (counted) onSearchCounted();
        dispatch({ type: "event", event: { type: "step", step: "reading", status: "active" } });
        const result = await searchOverpass(parts, {
          signal: controller.signal,
          onProgress: (progress) => dispatch({ type: "osm", progress }),
        });
        dispatch({ type: "osm", progress: null });
        if (result.failure && result.elements.length === 0) {
          fail(FAILURE_CODES[result.failure]);
          return null;
        }
        elements = result.elements;
        if (result.failure) dispatch({ type: "partial" });
        else if (counted) writeCachedSearch(key, elements);
      }
      return post("/api/radar/osm/results", { ...query, elements, cached: Boolean(cached) });
    }

    let finished = false;

    try {
      let response: Response;
      if (source === "osm") {
        const posted = await osmSearch();
        if (!posted || refused(posted)) return;
        response = posted;
      } else {
        response = await post("/api/radar/search", query);
        if (refused(response)) return;
        // Só uma resposta aceite gasta uma busca do limite.
        onSearchCounted();
      }
      if (!response.body) return fail("provider");

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
  const searching = state.phase === "searching" || found;
  const phase = searching ? "searching" : state.phase === "results" ? "done" : "idle";
  const consoleBar = (
    <RadarConsole
      phase={found && (mapDone || !target) ? "done" : phase}
      isSample={isSample}
      usage={usage}
      isAdmin={isAdmin}
      source={source}
    />
  );

  // Avisos sobre os resultados da busca no OpenStreetMap: incompletos ou da memória.
  const osmNotes = (state.partial || state.cachedMinutes !== null) && (
    <div className="flex flex-col gap-3">
      {state.partial && (
        <Callout role="status" tone="amber">
          {copy.osm.partial}
        </Callout>
      )}
      {state.cachedMinutes !== null && (
        <div
          data-testid="radar-osm-cached"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
        >
          <p className="text-14 text-muted">
            {copy.osm.cached(state.cachedMinutes)}
          </p>
          <Button variant="secondary" size="sm" onClick={() => search(values, { refresh: true })}>
            {copy.osm.refresh}
          </Button>
        </div>
      )}
    </div>
  );

  if (found && (mapDone || !target)) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="border-b border-border px-4 py-3 lg:px-8">{consoleBar}</div>
        {osmNotes && <div className="px-4 pt-4 lg:px-8">{osmNotes}</div>}
        <RadarResults
          results={state.companies}
          isSample={isSample}
          service={values.service}
          onNewSearch={reset}
          savedIds={savedIds}
          onSaved={onSaved}
          initialFilters={filtersFromPre(preFilters)}
          senderName={senderName}
          source={source}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-300 flex-1 flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
      {consoleBar}
    <div className="grid flex-1 grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)]">
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
            preFilters={preFilters}
            onPreFiltersChange={setPreFilters}
          />
        )}
        {state.phase === "idle" && (
          <ManualSearchActions niche={values.niche} locality={values.locality} />
        )}
        {searching && (
          <SearchProgress
            steps={state.steps}
            companies={state.companies}
            status={osmLabel(state.osm)}
            startedAt={state.osm ? state.startedAt : null}
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
        {state.phase === "results" && !found && osmNotes}
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
        className={searching ? "order-first lg:order-none lg:sticky lg:top-24" : "lg:sticky lg:top-24"}
        searching={searching}
        target={target}
        isSample={isSample}
        companies={state.companies}
        done={state.phase !== "searching"}
        onMapComplete={() => setMapDone(true)}
        hud={{
          phase,
          locality: resolveLocality(values.locality, markets)?.name ?? null,
          niche: values.niche,
        }}
      />
    </div>
    </div>
  );
}
