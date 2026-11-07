import { readNdjson } from "@/lib/read-ndjson";
import type { Company, Opportunity, SearchQuery, SiteSignals } from "./types";
import { SERVICE_IDS } from "./types";

export const MAX_FILTER_LENGTH = 80;

// Sem estado, a empresa não tem site para verificar ou a verificação está desligada.
export type SiteCheckStatus = "checking" | "checked" | "failed" | "skipped";
export type ScoredCompany = {
  company: Company;
  opportunity: Opportunity;
  siteCheck?: SiteCheckStatus;
};
export type SearchStep = "reading" | "scoring";
export type SearchErrorCode =
  | "provider"
  | "limit"
  | "budget"
  | "offline"
  | "unavailable"
  | "locality"
  // Os servidores públicos do OpenStreetMap estavam cheios.
  | "busy"
  // O OpenStreetMap demorou demasiado a responder.
  | "timeout";

export type SearchEvent =
  | { type: "step"; step: SearchStep; status: "active" | "done" }
  | ({ type: "company" } & ScoredCompany)
  | { type: "done"; count: number }
  | { type: "error"; code: SearchErrorCode }
  // Depois de "done": os resultados já estão no ecrã e a nota vai-se atualizando.
  | { type: "sites_start"; checking: string[]; skipped: string[] }
  | {
      type: "site";
      id: string;
      status: "checked";
      site: SiteSignals;
      opportunity: Opportunity;
    }
  | { type: "site"; id: string; status: "failed" }
  | { type: "sites_done"; checked: number; failed: number; skipped: number };

export function parseSearchQuery(body: unknown): SearchQuery | null {
  if (typeof body !== "object" || body === null) return null;

  const { service, niche, locality } = body as Record<string, unknown>;
  const validService = SERVICE_IDS.find((id) => id === service);
  if (!validService || typeof niche !== "string" || typeof locality !== "string") {
    return null;
  }

  const query = {
    service: validService,
    niche: niche.trim().slice(0, MAX_FILTER_LENGTH),
    locality: locality.trim().slice(0, MAX_FILTER_LENGTH),
  };

  return query.niche && query.locality ? query : null;
}

export function readSearchEvents(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: SearchEvent) => void,
) {
  return readNdjson<SearchEvent>(body, onEvent);
}
