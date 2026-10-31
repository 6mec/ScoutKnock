import {
  parseGoogleConfig,
  spendGoogleCall,
  type GoogleCallKind,
} from "./google-budget";
import { createGoogleProvider } from "./google-provider";
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

// Com chave mas sem tetos e custos válidos, não arranca: nunca há gasto sem travão.
// Sem fornecedor real, a produção devolve null e nunca mostra dados fictícios.
export function getCompanyProvider({
  userId,
  onCall,
  env = process.env,
}: {
  userId?: string;
  onCall?: (kind: GoogleCallKind) => void;
  env?: Record<string, string | undefined>;
} = {}): CompanyProvider | null {
  if (env.GOOGLE_PLACES_API_KEY) {
    const config = parseGoogleConfig(env);
    if (!config) return null;

    return createGoogleProvider({
      config,
      onCall,
      spend: async (kind) => {
        // Só aqui, para este ficheiro não exigir a chave secreta ao ser importado.
        const { createAdminClient } = await import("@/lib/supabase/admin");
        return spendGoogleCall(createAdminClient(), config, kind, userId);
      },
    });
  }

  return env.NODE_ENV === "production" ? null : sampleProvider;
}
