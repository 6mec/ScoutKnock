import { GoogleBudgetError } from "./google-provider";
import type { CompanyProvider } from "./provider";
import { scoreCompany } from "./score";
import type { SearchEvent } from "./search-events";
import type { SearchQuery } from "./types";

// Cada evento corresponde a trabalho já feito: o registo do ecrã nunca se adianta.
export async function* runSearch(
  provider: CompanyProvider,
  query: SearchQuery,
  signal?: AbortSignal,
): AsyncGenerator<SearchEvent> {
  let count = 0;

  yield { type: "step", step: "reading", status: "active" };

  try {
    for await (const company of provider.stream(query, signal)) {
      if (signal?.aborted) return;
      if (count === 0) yield { type: "step", step: "scoring", status: "active" };

      yield {
        type: "company",
        company,
        opportunity: scoreCompany(company, query.service),
      };
      count += 1;
    }
  } catch (error) {
    if (signal?.aborted) return;
    console.error(`radar: ${error instanceof Error ? error.message || error.name : "erro"}`);
    yield {
      type: "error",
      code: error instanceof GoogleBudgetError ? "budget" : "provider",
    };
    return;
  }

  yield { type: "step", step: "reading", status: "done" };
  yield { type: "step", step: "scoring", status: "done" };
  yield { type: "done", count };
}
