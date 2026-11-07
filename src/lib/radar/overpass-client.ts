import { cleanOsmElements } from "./osm-elements";
import { MAX_OSM_RESULTS, type OsmElement } from "./osm";

// Pedidos à API pública Overpass (OpenStreetMap). Corre no browser na busca do Radar,
// porque uma busca pode levar mais tempo do que uma função do servidor aguenta, e no
// servidor para abrir a ficha de uma empresa (pedido pequeno).
//
// Regras de uso do Overpass: um pedido de cada vez, nunca em rajada; um servidor cheio
// passa ao seguinte sem repetir logo; só depois de todos falharem há uma espera e uma
// segunda volta.

// Ordem de preferência. Todos aceitam pedidos de outras origens (CORS).
export const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

// A consulta declara 25 s ao servidor; a margem é para a fila e a rede.
export const REQUEST_TIMEOUT_MS = 30_000;
export const RETRY_WAIT_MS = 10_000;
export const PART_PAUSE_MS = 1_000;
// A busca inteira, com todas as partes e tentativas.
export const SEARCH_TOTAL_MS = 90_000;

export type OverpassFailure = "busy" | "timeout" | "offline" | "rejected";

export class OverpassError extends Error {
  constructor(
    readonly code: OverpassFailure,
    readonly status = 0,
  ) {
    super(`osm: ${status || code}`);
  }
}

export type OverpassProgress =
  | { type: "part"; part: number; parts: number }
  | { type: "server"; server: number; servers: number }
  | { type: "wait"; seconds: number };

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export type OverpassOptions = {
  fetchImpl?: FetchLike;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  endpoints?: string[];
  rounds?: number;
  requestTimeoutMs?: number;
  retryWaitMs?: number;
  onProgress?: (progress: OverpassProgress) => void;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
};

export function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(signal!.reason);
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

const isOffline = () => typeof navigator !== "undefined" && navigator.onLine === false;

// Com tempo ou memória a mais, o Overpass responde 200 com um aviso em vez dos dados.
const SERVER_LIMIT = /runtime error|timed out|out of memory|runtime limit/i;

export async function runOverpassQuery(
  query: string,
  {
    fetchImpl = (input, init) => fetch(input, init),
    signal,
    headers,
    endpoints = OVERPASS_ENDPOINTS,
    rounds = 2,
    requestTimeoutMs = REQUEST_TIMEOUT_MS,
    retryWaitMs = RETRY_WAIT_MS,
    onProgress,
    sleep = wait,
  }: OverpassOptions = {},
): Promise<OsmElement[]> {
  const failures: OverpassFailure[] = [];
  let lastStatus = 0;

  for (let round = 0; round < rounds; round += 1) {
    if (round > 0) {
      onProgress?.({ type: "wait", seconds: Math.round(retryWaitMs / 1000) });
      await sleep(retryWaitMs, signal);
    }

    for (const [index, endpoint] of endpoints.entries()) {
      signal?.throwIfAborted();
      onProgress?.({ type: "server", server: index + 1, servers: endpoints.length });
      const timeout = AbortSignal.timeout(requestTimeoutMs);
      const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;

      try {
        const response = await fetchImpl(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers },
          body: new URLSearchParams({ data: query }).toString(),
          signal: requestSignal,
        });
        // Cheio ou com limite: o seguinte pode responder.
        if (response.status === 429 || response.status >= 500) {
          lastStatus = response.status;
          failures.push("busy");
          continue;
        }
        // A consulta é feita pela app: um 400 é um erro nosso, outro servidor não ajuda.
        if (!response.ok) throw new OverpassError("rejected", response.status);
        const body = (await response.json()) as { elements?: unknown; remark?: unknown };
        if (typeof body.remark === "string" && SERVER_LIMIT.test(body.remark)) {
          failures.push("timeout");
          continue;
        }
        return Array.isArray(body.elements) ? (body.elements as OsmElement[]) : [];
      } catch (error) {
        if (signal?.aborted) throw signal.reason;
        if (error instanceof OverpassError) throw error;
        if (isOffline()) throw new OverpassError("offline");
        failures.push(timeout.aborted ? "timeout" : "busy");
      }
    }
  }

  const allTimeouts = failures.length > 0 && failures.every((failure) => failure === "timeout");
  throw new OverpassError(allTimeouts ? "timeout" : "busy", allTimeouts ? 0 : lastStatus);
}

export type OverpassSearch = {
  elements: OsmElement[];
  // A falha que parou a busca. Com elementos, os resultados ficam incompletos.
  failure?: OverpassFailure;
};

// As partes uma de cada vez, com uma pausa entre elas, até haver empresas que cheguem.
// Só um cancelamento de quem procura lança erro; as falhas do Overpass vêm no resultado.
export async function searchOverpass(
  parts: string[],
  {
    signal,
    totalMs = SEARCH_TOTAL_MS,
    pauseMs = PART_PAUSE_MS,
    limit = MAX_OSM_RESULTS,
    ...options
  }: OverpassOptions & { totalMs?: number; pauseMs?: number; limit?: number } = {},
): Promise<OverpassSearch> {
  const deadline = AbortSignal.timeout(totalMs);
  const stop = signal ? AbortSignal.any([signal, deadline]) : deadline;
  const sleep = options.sleep ?? wait;
  const seen = new Set<string>();
  const elements: OsmElement[] = [];

  for (const [index, query] of parts.entries()) {
    try {
      if (index > 0) await sleep(pauseMs, stop);
      options.onProgress?.({ type: "part", part: index + 1, parts: parts.length });
      const found = cleanOsmElements(await runOverpassQuery(query, { ...options, signal: stop, sleep }));
      for (const element of found) {
        const key = `${element.type}-${element.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        elements.push(element);
      }
    } catch (error) {
      if (signal?.aborted) throw signal.reason;
      if (deadline.aborted) return { elements, failure: "timeout" };
      if (error instanceof OverpassError) return { elements, failure: error.code };
      return { elements, failure: "busy" };
    }
    if (elements.length >= limit) break;
  }

  return { elements: elements.slice(0, limit) };
}
