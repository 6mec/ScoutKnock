import type { GoogleCallKind, GoogleConfig, SpendResult } from "./google-budget";
import { marketOf } from "./localities";
import type { CompanyProvider } from "./provider";
import type { Company } from "./types";

const API_URL = "https://places.googleapis.com/v1/places";
const TIMEOUT_MS = 10_000;
const PAGE_RESULTS = 20;

// Só os campos usados, porque o preço depende deles. Site, telefone, avaliações
// e horário são do escalão Enterprise, o mais caro, e a nota precisa de todos.
const FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "websiteUri",
  "internationalPhoneNumber",
  "userRatingCount",
  "regularOpeningHours",
  "businessStatus",
];
const SEARCH_MASK = [
  ...FIELDS.map((field) => `places.${field}`),
  "nextPageToken",
].join(",");
const DETAILS_MASK = [...FIELDS, "primaryTypeDisplayName", "addressComponents"].join(",");

export type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  websiteUri?: string;
  internationalPhoneNumber?: string;
  userRatingCount?: number;
  regularOpeningHours?: unknown;
  businessStatus?: string;
  primaryTypeDisplayName?: { text?: string };
  addressComponents?: { longText?: string; types?: string[] }[];
};

// Só o código HTTP segue nos erros: nunca o pedido, que leva a chave nos cabeçalhos.
export class GoogleApiError extends Error {
  constructor(readonly status: number) {
    super(`google: ${status}`);
  }
}

export class GoogleBudgetError extends Error {
  readonly code = "budget";
}

// Sem nome ou fechada de vez, não serve de oportunidade. Os sinais do site
// ficam a null até haver verificação própria: não dão pontos.
export function placeToCompany(
  place: GooglePlace,
  niche: string,
  locality: string,
): Company | null {
  const name = place.displayName?.text?.trim();
  if (!place.id || !name || place.businessStatus === "CLOSED_PERMANENTLY") {
    return null;
  }

  return {
    id: place.id,
    name,
    niche,
    locality,
    address: place.formattedAddress ?? "",
    phone: place.internationalPhoneNumber ?? null,
    website: place.websiteUri ?? null,
    reviewCount: place.userRatingCount ?? 0,
    hasOpeningHours: Boolean(place.regularOpeningHours),
    site: { isSlow: null, isMobileFriendly: null, isOutdated: null },
  };
}

export function createGoogleProvider({
  config,
  spend,
  onCall,
  fetcher = fetch,
}: {
  config: GoogleConfig;
  spend: (kind: GoogleCallKind) => Promise<SpendResult>;
  onCall?: (kind: GoogleCallKind) => void;
  fetcher?: typeof fetch;
}): CompanyProvider {
  async function call(
    kind: GoogleCallKind,
    url: string,
    mask: string,
    init: RequestInit,
    signal?: AbortSignal,
  ) {
    if ((await spend(kind)) !== "ok") throw new GoogleBudgetError();

    onCall?.(kind);
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    const response = await fetcher(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": config.apiKey,
        "X-Goog-FieldMask": mask,
      },
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });

    if (!response.ok) throw new GoogleApiError(response.status);
    return response.json();
  }

  function searchPlace(niche: string, locality: string) {
    const market = marketOf(locality);
    if (market === "PT") {
      return { textQuery: `${niche} em ${locality}, Portugal`, regionCode: "PT" };
    }
    if (market === "BR") {
      return { textQuery: `${niche} em ${locality}, Brasil`, regionCode: "BR" };
    }
    return { textQuery: `${niche} em ${locality}` };
  }

  const provider: CompanyProvider = {
    usesSampleData: false,
    async *stream({ niche, locality }, signal) {
      let pageToken: string | undefined;

      for (let page = 0; page < config.maxPages; page += 1) {
        let body: { places?: GooglePlace[]; nextPageToken?: string };

        try {
          body = await call(
            "text_search",
            `${API_URL}:searchText`,
            SEARCH_MASK,
            {
              method: "POST",
              body: JSON.stringify({
                ...searchPlace(niche, locality),
                pageSize: PAGE_RESULTS,
                languageCode: "pt-PT",
                ...(pageToken ? { pageToken } : {}),
              }),
            },
            signal,
          );
        } catch (error) {
          // Com o teto atingido a meio, ficam os resultados que já há.
          if (page > 0 && error instanceof GoogleBudgetError) return;
          throw error;
        }

        for (const place of body.places ?? []) {
          const company = placeToCompany(place, niche, locality);
          if (company) yield company;
        }

        pageToken = body.nextPageToken;
        if (!pageToken) return;
      }
    },
    async search(query) {
      const companies: Company[] = [];
      for await (const company of provider.stream(query)) companies.push(company);
      return companies;
    },
    // Quem chama trata null como "sem empresa": teto atingido ou erro da API
    // nunca podem rebentar uma ação do utilizador.
    async findById(id) {
      if (!/^[\w-]+$/.test(id)) return null;

      try {
        const place: GooglePlace = await call(
          "place_details",
          `${API_URL}/${id}?languageCode=pt-PT`,
          DETAILS_MASK,
          { method: "GET" },
        );
        const address = place.formattedAddress ?? "";
        const locality = place.addressComponents?.find((part) =>
          part.types?.includes("locality"),
        )?.longText;

        return placeToCompany(
          place,
          place.primaryTypeDisplayName?.text ?? "",
          locality ?? address,
        );
      } catch (error) {
        console.error(
          `radar detalhes: ${error instanceof Error ? error.message : "erro"}`,
        );
        return null;
      }
    },
  };

  return provider;
}
