// Zonas exploradas: as localidades das buscas feitas (histórico de eventos), com quantas
// buscas, quantas empresas apareceram e os nichos. Só o que a pessoa escreveu.

export type SearchEventRow = { data: { service?: string; niche?: string; locality?: string; count?: number; cancelled?: boolean } | null; created_at: string };

export type Zone = { locality: string; searches: number; companies: number; niches: string[]; last: string };

export function exploredZones(rows: SearchEventRow[], limit = 8): Zone[] {
  const zones = new Map<string, Zone>();
  for (const row of rows) {
    const data = row.data;
    if (!data || data.cancelled || !data.locality?.trim()) continue;
    const locality = data.locality.trim();
    const key = locality.toLocaleLowerCase("pt-PT");
    const zone = zones.get(key) ?? { locality, searches: 0, companies: 0, niches: [], last: row.created_at };
    zone.searches += 1;
    zone.companies += Math.max(0, Number(data.count) || 0);
    const niche = data.niche?.trim();
    if (niche && !zone.niches.some((item) => item.toLocaleLowerCase("pt-PT") === niche.toLocaleLowerCase("pt-PT"))) zone.niches.push(niche);
    if (row.created_at > zone.last) zone.last = row.created_at;
    zones.set(key, zone);
  }
  return [...zones.values()].sort((a, b) => b.last.localeCompare(a.last)).slice(0, limit);
}
