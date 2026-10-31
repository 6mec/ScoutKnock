import { SAMPLE_COMPANIES } from "./sample-companies";
import type { Company, SearchQuery } from "./types";

export type CompanyProvider = {
  usesSampleData: boolean;
  search: (query: SearchQuery) => Promise<Company[]>;
  stream: (query: SearchQuery, signal?: AbortSignal) => AsyncIterable<Company>;
  findById: (id: string) => Promise<Company | null>;
};

// Os dados de exemplo respondem logo; a espera deixa ver o estado "a procurar".
const SAMPLE_DELAY_MS = 450;

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
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
  async findById(id) {
    return SAMPLE_COMPANIES.find((company) => company.id === id) ?? null;
  },
  async *stream(query, signal) {
    await wait(SAMPLE_DELAY_MS, signal);

    for (const company of await sampleProvider.search(query)) {
      if (signal?.aborted) return;
      yield company;
      await wait(SAMPLE_DELAY_MS, signal);
    }
  },
};

// Sem fornecedor real, a produção devolve null e nunca mostra dados fictícios.
export function getCompanyProvider(
  nodeEnv = process.env.NODE_ENV,
): CompanyProvider | null {
  return nodeEnv === "production" ? null : sampleProvider;
}
