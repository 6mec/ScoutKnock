import type { Market } from "@/lib/markets";

export type Locality = {
  name: string;
  // Distrito ou região, para ajudar a distinguir nas sugestões.
  group: string;
  market: Market;
  location: [number, number];
};

// As coordenadas são do distrito e só servem para o globo decorativo.
const PORTUGAL: { name: string; location: [number, number]; concelhos: string[] }[] = [
  {
    name: "Aveiro",
    location: [40.64, -8.65],
    concelhos: [
      "Águeda", "Albergaria-a-Velha", "Anadia", "Arouca", "Aveiro", "Castelo de Paiva",
      "Espinho", "Estarreja", "Ílhavo", "Mealhada", "Murtosa", "Oliveira de Azeméis",
      "Oliveira do Bairro", "Ovar", "Santa Maria da Feira", "São João da Madeira",
      "Sever do Vouga", "Vagos", "Vale de Cambra",
    ],
  },
  {
    name: "Beja",
    location: [38.02, -7.86],
    concelhos: [
      "Aljustrel", "Almodôvar", "Alvito", "Barrancos", "Beja", "Castro Verde", "Cuba",
      "Ferreira do Alentejo", "Mértola", "Moura", "Odemira", "Ourique", "Serpa", "Vidigueira",
    ],
  },
  {
    name: "Braga",
    location: [41.55, -8.42],
    concelhos: [
      "Amares", "Barcelos", "Braga", "Cabeceiras de Basto", "Celorico de Basto", "Esposende",
      "Fafe", "Guimarães", "Póvoa de Lanhoso", "Terras de Bouro", "Vieira do Minho",
      "Vila Nova de Famalicão", "Vila Verde", "Vizela",
    ],
  },
  {
    name: "Bragança",
    location: [41.81, -6.76],
    concelhos: [
      "Alfândega da Fé", "Bragança", "Carrazeda de Ansiães", "Freixo de Espada à Cinta",
      "Macedo de Cavaleiros", "Miranda do Douro", "Mirandela", "Mogadouro",
      "Torre de Moncorvo", "Vila Flor", "Vimioso", "Vinhais",
    ],
  },
  {
    name: "Castelo Branco",
    location: [39.82, -7.49],
    concelhos: [
      "Belmonte", "Castelo Branco", "Covilhã", "Fundão", "Idanha-a-Nova", "Oleiros",
      "Penamacor", "Proença-a-Nova", "Sertã", "Vila de Rei", "Vila Velha de Ródão",
    ],
  },
  {
    name: "Coimbra",
    location: [40.21, -8.43],
    concelhos: [
      "Arganil", "Cantanhede", "Coimbra", "Condeixa-a-Nova", "Figueira da Foz", "Góis", "Lousã",
      "Mira", "Miranda do Corvo", "Montemor-o-Velho", "Oliveira do Hospital",
      "Pampilhosa da Serra", "Penacova", "Penela", "Soure", "Tábua", "Vila Nova de Poiares",
    ],
  },
  {
    name: "Évora",
    location: [38.57, -7.91],
    concelhos: [
      "Alandroal", "Arraiolos", "Borba", "Estremoz", "Évora", "Montemor-o-Novo", "Mora",
      "Mourão", "Portel", "Redondo", "Reguengos de Monsaraz", "Vendas Novas",
      "Viana do Alentejo", "Vila Viçosa",
    ],
  },
  {
    name: "Faro",
    location: [37.02, -7.93],
    concelhos: [
      "Albufeira", "Alcoutim", "Aljezur", "Castro Marim", "Faro", "Lagoa (Algarve)", "Lagos",
      "Loulé", "Monchique", "Olhão", "Portimão", "São Brás de Alportel", "Silves", "Tavira",
      "Vila do Bispo", "Vila Real de Santo António",
    ],
  },
  {
    name: "Guarda",
    location: [40.54, -7.27],
    concelhos: [
      "Aguiar da Beira", "Almeida", "Celorico da Beira", "Figueira de Castelo Rodrigo",
      "Fornos de Algodres", "Gouveia", "Guarda", "Manteigas", "Mêda", "Pinhel", "Sabugal",
      "Seia", "Trancoso", "Vila Nova de Foz Côa",
    ],
  },
  {
    name: "Leiria",
    location: [39.74, -8.81],
    concelhos: [
      "Alcobaça", "Alvaiázere", "Ansião", "Batalha", "Bombarral", "Caldas da Rainha",
      "Castanheira de Pera", "Figueiró dos Vinhos", "Leiria", "Marinha Grande", "Nazaré",
      "Óbidos", "Pedrógão Grande", "Peniche", "Pombal", "Porto de Mós",
    ],
  },
  {
    name: "Lisboa",
    location: [38.72, -9.14],
    concelhos: [
      "Alenquer", "Amadora", "Arruda dos Vinhos", "Azambuja", "Cadaval", "Cascais", "Lisboa",
      "Loures", "Lourinhã", "Mafra", "Odivelas", "Oeiras", "Sintra", "Sobral de Monte Agraço",
      "Torres Vedras", "Vila Franca de Xira",
    ],
  },
  {
    name: "Portalegre",
    location: [39.29, -7.43],
    concelhos: [
      "Alter do Chão", "Arronches", "Avis", "Campo Maior", "Castelo de Vide", "Crato", "Elvas",
      "Fronteira", "Gavião", "Marvão", "Monforte", "Nisa", "Ponte de Sor", "Portalegre", "Sousel",
    ],
  },
  {
    name: "Porto",
    location: [41.15, -8.61],
    concelhos: [
      "Amarante", "Baião", "Felgueiras", "Gondomar", "Lousada", "Maia", "Marco de Canaveses",
      "Matosinhos", "Paços de Ferreira", "Paredes", "Penafiel", "Porto", "Póvoa de Varzim",
      "Santo Tirso", "Trofa", "Valongo", "Vila do Conde", "Vila Nova de Gaia",
    ],
  },
  {
    name: "Santarém",
    location: [39.24, -8.69],
    concelhos: [
      "Abrantes", "Alcanena", "Almeirim", "Alpiarça", "Benavente", "Cartaxo", "Chamusca",
      "Constância", "Coruche", "Entroncamento", "Ferreira do Zêzere", "Golegã", "Mação",
      "Ourém", "Rio Maior", "Salvaterra de Magos", "Santarém", "Sardoal", "Tomar",
      "Torres Novas", "Vila Nova da Barquinha",
    ],
  },
  {
    name: "Setúbal",
    location: [38.52, -8.89],
    concelhos: [
      "Alcácer do Sal", "Alcochete", "Almada", "Barreiro", "Grândola", "Moita", "Montijo",
      "Palmela", "Santiago do Cacém", "Seixal", "Sesimbra", "Setúbal", "Sines",
    ],
  },
  {
    name: "Viana do Castelo",
    location: [41.69, -8.83],
    concelhos: [
      "Arcos de Valdevez", "Caminha", "Melgaço", "Monção", "Paredes de Coura", "Ponte da Barca",
      "Ponte de Lima", "Valença", "Viana do Castelo", "Vila Nova de Cerveira",
    ],
  },
  {
    name: "Vila Real",
    location: [41.3, -7.74],
    concelhos: [
      "Alijó", "Boticas", "Chaves", "Mesão Frio", "Mondim de Basto", "Montalegre", "Murça",
      "Peso da Régua", "Ribeira de Pena", "Sabrosa", "Santa Marta de Penaguião", "Valpaços",
      "Vila Pouca de Aguiar", "Vila Real",
    ],
  },
  {
    name: "Viseu",
    location: [40.66, -7.91],
    concelhos: [
      "Armamar", "Carregal do Sal", "Castro Daire", "Cinfães", "Lamego", "Mangualde",
      "Moimenta da Beira", "Mortágua", "Nelas", "Oliveira de Frades", "Penalva do Castelo",
      "Penedono", "Resende", "Santa Comba Dão", "São João da Pesqueira", "São Pedro do Sul",
      "Sátão", "Sernancelhe", "Tabuaço", "Tarouca", "Tondela", "Vila Nova de Paiva", "Viseu",
      "Vouzela",
    ],
  },
  {
    name: "Açores",
    location: [37.74, -25.67],
    concelhos: [
      "Angra do Heroísmo", "Calheta (Açores)", "Corvo", "Horta", "Lagoa (Açores)",
      "Lajes das Flores", "Lajes do Pico", "Madalena", "Nordeste", "Ponta Delgada", "Povoação",
      "Praia da Vitória", "Ribeira Grande", "Santa Cruz da Graciosa", "Santa Cruz das Flores",
      "São Roque do Pico", "Velas", "Vila do Porto", "Vila Franca do Campo",
    ],
  },
  {
    name: "Madeira",
    location: [32.65, -16.91],
    concelhos: [
      "Calheta (Madeira)", "Câmara de Lobos", "Funchal", "Machico", "Ponta do Sol", "Porto Moniz",
      "Porto Santo", "Ribeira Brava", "Santa Cruz", "Santana", "São Vicente",
    ],
  },
];

export const PORTUGAL_AREAS = PORTUGAL;

const PORTUGAL_LOCALITIES: Locality[] = PORTUGAL.flatMap(({ name, location, concelhos }) => [
  // O distrito só entra à parte quando não há um concelho com o mesmo nome.
  ...(concelhos.includes(name) ? [] : [{ name, group: name, market: "PT" as const, location }]),
  ...concelhos.map((concelho) => ({
    name: concelho,
    group: name,
    market: "PT" as const,
    location,
  })),
]);

// Desligadas enquanto o Brasil não estiver em MARKETS_ENABLED.
const BRAZIL_LOCALITIES: Locality[] = [
  { name: "São Paulo", group: "Brasil", market: "BR", location: [-23.55, -46.63] },
  { name: "Rio de Janeiro", group: "Brasil", market: "BR", location: [-22.91, -43.17] },
  { name: "Belo Horizonte", group: "Brasil", market: "BR", location: [-19.92, -43.94] },
  { name: "Curitiba", group: "Brasil", market: "BR", location: [-25.43, -49.27] },
];

const ALL_LOCALITIES = [...PORTUGAL_LOCALITIES, ...BRAZIL_LOCALITIES];

export function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

export function localitiesFor(markets: Market[]) {
  return ALL_LOCALITIES.filter(({ market }) => markets.includes(market));
}

// Devolve o nome certo da lista, ou null se a localidade não estiver disponível.
export function resolveLocality(value: string, markets: Market[]) {
  const wanted = normalizeText(value);

  return (
    localitiesFor(markets).find(({ name }) => normalizeText(name) === wanted) ?? null
  );
}

export function findLocation(locality: string, markets: Market[]) {
  return resolveLocality(locality, markets)?.location ?? null;
}

export function marketOf(locality: string): Market | null {
  const wanted = normalizeText(locality);

  return ALL_LOCALITIES.find(({ name }) => normalizeText(name) === wanted)?.market ?? null;
}
