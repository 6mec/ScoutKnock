// Só para o globo e as sugestões. Com o Google Places, as coordenadas vêm da API.
export const LOCALITIES: { name: string; location: [number, number] }[] = [
  { name: "Porto", location: [41.15, -8.61] },
  { name: "Lisboa", location: [38.72, -9.14] },
  { name: "Braga", location: [41.55, -8.42] },
  { name: "Coimbra", location: [40.21, -8.43] },
  { name: "Faro", location: [37.02, -7.93] },
  { name: "São Paulo", location: [-23.55, -46.63] },
  { name: "Rio de Janeiro", location: [-22.91, -43.17] },
  { name: "Belo Horizonte", location: [-19.92, -43.94] },
  { name: "Curitiba", location: [-25.43, -49.27] },
];

export function findLocation(locality: string) {
  const wanted = locality.trim().toLowerCase();

  return (
    LOCALITIES.find(({ name }) => name.toLowerCase() === wanted)?.location ?? null
  );
}
