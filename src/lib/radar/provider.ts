import { SAMPLE_COMPANIES } from "./sample-companies";
import type { Company, SearchQuery } from "./types";

export type CompanyProvider = {
  usesSampleData: boolean;
  search: (query: SearchQuery) => Promise<Company[]>;
};

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

export const sampleProvider: CompanyProvider = {
  usesSampleData: true,
  async search({ niche, locality }) {
    const wantedNiche = normalize(niche);
    const wantedLocality = normalize(locality);

    return SAMPLE_COMPANIES.filter(
      (company) =>
        normalize(company.niche).includes(wantedNiche) &&
        normalize(company.locality).includes(wantedLocality),
    );
  },
};

// Sem fornecedor real, a produção devolve null e nunca mostra dados fictícios.
export function getCompanyProvider(
  nodeEnv = process.env.NODE_ENV,
): CompanyProvider | null {
  return nodeEnv === "production" ? null : sampleProvider;
}
