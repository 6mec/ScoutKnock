import { SAMPLE_COMPANIES } from "./sample-companies";
import type { Company } from "./types";

// Empresas fictícias da landing. As notas são sempre calculadas por scoreCompany.
export const LANDING_EXAMPLE: Company = SAMPLE_COMPANIES[0];

const fictional = {
  niche: "Barbearias",
  locality: "Porto",
  address: "",
};

const siteOk = { isSlow: false, isMobileFriendly: true, isOutdated: false };

function simulated(
  niche: string,
  locality: string,
  companies: (Pick<Company, "id" | "name" | "website" | "reviewCount" | "hasOpeningHours"> &
    Partial<Pick<Company, "site">>)[],
): Company[] {
  return companies.map((company) => ({
    niche,
    locality,
    address: "",
    site: siteOk,
    ...company,
  }));
}

export const SIMULATION_NICHES = [
  {
    id: "pastelarias",
    companies: simulated("Pastelarias", "Porto", [
      { id: "sim-praca", name: "Pastelaria Fictícia da Praça", website: null, reviewCount: 12, hasOpeningHours: true },
      {
        id: "sim-largo",
        name: "Pastelaria Exemplo do Largo",
        website: "https://pastelaria-do-largo.example",
        reviewCount: 60,
        hasOpeningHours: true,
        site: { isSlow: true, isMobileFriendly: false, isOutdated: false },
      },
      { id: "sim-doces", name: "Doces de Exemplo", website: "https://doces-de-exemplo.example", reviewCount: 140, hasOpeningHours: false },
    ]),
  },
  {
    id: "barbearias",
    companies: simulated("Barbearias", "Braga", [
      {
        id: "sim-cais",
        name: "Barbearia Fictícia do Cais",
        website: "https://barbearia-do-cais.example",
        reviewCount: 8,
        hasOpeningHours: false,
        site: { ...siteOk, notOwn: "social" },
      },
      {
        id: "sim-corte",
        name: "Corte de Exemplo",
        website: "https://corte-de-exemplo.example",
        reviewCount: 35,
        hasOpeningHours: true,
        site: { isSlow: false, isMobileFriendly: false, isOutdated: true },
      },
      { id: "sim-navalha", name: "Navalha Fictícia", website: "https://navalha-ficticia.example", reviewCount: 210, hasOpeningHours: true },
    ]),
  },
  {
    id: "oficinas",
    companies: simulated("Oficinas", "Coimbra", [
      { id: "sim-vale", name: "Oficina Fictícia do Vale", website: null, reviewCount: 45, hasOpeningHours: true },
      {
        id: "sim-auto",
        name: "Auto Exemplo",
        website: "https://auto-exemplo.example",
        reviewCount: 15,
        hasOpeningHours: true,
        site: { isSlow: true, isMobileFriendly: true, isOutdated: true },
      },
      {
        id: "sim-garagem",
        name: "Garagem Fictícia",
        website: "https://garagem-ficticia.example",
        reviewCount: 90,
        hasOpeningHours: true,
        site: { isSlow: false, isMobileFriendly: false, isOutdated: false },
      },
    ]),
  },
] as const satisfies readonly { id: string; companies: Company[] }[];

export type SimulationNicheId = (typeof SIMULATION_NICHES)[number]["id"];

export const HERO_COMPANIES: Company[] = [
  LANDING_EXAMPLE,
  {
    ...fictional,
    id: "hero-navalha",
    name: "Navalha & Pente",
    website: "https://navalha-pente.example",
    reviewCount: 80,
    hasOpeningHours: true,
    site: { isSlow: true, isMobileFriendly: false, isOutdated: true },
  },
  {
    ...fictional,
    id: "hero-atlantico",
    name: "Barbearia Atlântico",
    website: "https://barbearia-atlantico.example",
    reviewCount: 5,
    hasOpeningHours: false,
    site: { isSlow: false, isMobileFriendly: false, isOutdated: false },
  },
  {
    ...fictional,
    id: "hero-bairro",
    name: "Barbearia do Bairro",
    website: "https://barbearia-do-bairro.example",
    reviewCount: 210,
    hasOpeningHours: true,
    site: { isSlow: false, isMobileFriendly: true, isOutdated: false },
  },
];
