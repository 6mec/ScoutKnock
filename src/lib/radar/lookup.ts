import type { CompanyProvider } from "./provider";
import type { Company } from "./types";

export type CompanyLookup =
  | { status: "ok"; company: Company; isSample: boolean }
  | { status: "limit" }
  | { status: "unavailable" };

// Todas as consultas de detalhes passam por aqui. Só a real é paga, por isso só
// essa conta para o limite diário. Se não der para contar, não há chamada.
export async function lookupCompany(
  provider: CompanyProvider | null,
  id: string,
  consume: () => Promise<boolean | "error">,
): Promise<CompanyLookup> {
  if (!provider) return { status: "unavailable" };

  if (!provider.usesSampleData) {
    const allowed = await consume();
    if (allowed === "error") return { status: "unavailable" };
    if (!allowed) return { status: "limit" };
  }

  // A fonte pode estar em baixo (o Overpass está muitas vezes cheio): nunca rebenta.
  const company = await provider.findById(id).catch(() => null);

  return company
    ? { status: "ok", company, isSample: provider.usesSampleData }
    : { status: "unavailable" };
}
