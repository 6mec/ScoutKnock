import type { SearchQuery } from "./types";

// O Next guarda o ecrã do Radar com os resultados. "Nova busca" pede-lhe que recomece.
let requests = 0;
const listeners = new Set<() => void>();

export function requestNewSearch() {
  requests += 1;
  listeners.forEach((listener) => listener());
}

export function subscribeToNewSearch(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const newSearchRequests = () => requests;

// Repetir uma busca do painel: fica à espera até o Radar a ir buscar, uma só vez.
let pendingSearch: SearchQuery | null = null;

export function requestRepeatSearch(query: SearchQuery) {
  pendingSearch = query;
  requestNewSearch();
}

export function takePendingSearch() {
  const query = pendingSearch;
  pendingSearch = null;
  return query;
}
