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
