import type { Company, Opportunity, SearchQuery } from "./types";
import { SERVICE_IDS } from "./types";

export const MAX_FILTER_LENGTH = 80;

export type ScoredCompany = { company: Company; opportunity: Opportunity };
export type SearchStep = "reading" | "scoring";
export type SearchErrorCode = "provider" | "limit" | "offline" | "unavailable";

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

// Lê uma linha JSON de cada vez, mesmo que os pedaços da rede as cortem a meio.
export async function readSearchEvents(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: SearchEvent) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) return;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.filter(Boolean).forEach((line) => onEvent(JSON.parse(line)));
  }
}
