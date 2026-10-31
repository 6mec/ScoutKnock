import { SAMPLE_COMPANIES } from "./sample-companies";
import type { Company } from "./types";

// Empresas fictícias da landing. As notas são sempre calculadas por scoreCompany.
export const LANDING_EXAMPLE: Company = SAMPLE_COMPANIES[0];

const fictional = {
  niche: "Barbearias",
  locality: "Porto",
  address: "",
};

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
