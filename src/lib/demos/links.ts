// O {link_demo} das mensagens: a demo da própria empresa e, se não houver, a demo que o
// Daniel marcou como "exemplo do nicho" para o mesmo nicho. Nunca a demo de outra empresa
// sem essa marca (mostrava o nome e os dados dela).

export type DemoLinks = {
  byCompany: Record<string, string>;
  byNiche: Record<string, string>;
};

export const EMPTY_DEMO_LINKS: DemoLinks = { byCompany: {}, byNiche: {} };

const nicheKey = (niche: string | null | undefined) => (niche ?? "").trim().toLocaleLowerCase("pt-PT");

// `rows` vêm já sem as expiradas; a mais recente de cada nicho ganha (vêm por data, recentes primeiro).
export function buildDemoLinks(
  rows: { slug: string; company_id: string; niche: string; niche_example?: boolean | null }[],
  base: string,
): DemoLinks {
  const links: DemoLinks = { byCompany: {}, byNiche: {} };
  const root = base.replace(/\/$/, "");
  for (const row of rows) {
    const url = `${root}/demo/${row.slug}`;
    if (!links.byCompany[row.company_id]) links.byCompany[row.company_id] = url;
    const key = nicheKey(row.niche);
    if (row.niche_example && key && !links.byNiche[key]) links.byNiche[key] = url;
  }
  return links;
}

export function demoLinkFor(links: DemoLinks, contact: { company_id: string; manual_niche: string | null }) {
  return links.byCompany[contact.company_id] ?? links.byNiche[nicheKey(contact.manual_niche)] ?? null;
}

// Que variáveis o modelo usa e ficariam vazias (para avisar antes de abrir o WhatsApp).
export function missingVariables(template: string, values: { demo: string | null; portfolio: string | null }) {
  const missing: ("demo" | "portfolio")[] = [];
  if (/\{link_demo\}/i.test(template) && !values.demo) missing.push("demo");
  if (/\{(link_portfolio|portfolio)\}/i.test(template) && !values.portfolio) missing.push("portfolio");
  return missing;
}
