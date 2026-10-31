import { readNdjson } from "@/lib/read-ndjson";
import type { Company, Opportunity, SearchQuery } from "./types";
import { SERVICE_IDS } from "./types";

export const MAX_FILTER_LENGTH = 80;

export type ScoredCompany = { company: Company; opportunity: Opportunity };
export type SearchStep = "reading" | "scoring";
export type SearchErrorCode =
  | "provider"
  | "limit"
  | "budget"
  | "offline"
  | "unavailable";

export type SearchEvent =
  | { type: "step"; step: SearchStep; status: "active" | "done" }
  | ({ type: "company" } & ScoredCompany)
  | { type: "done"; count: number }
  | { type: "error"; code: SearchErrorCode };

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
