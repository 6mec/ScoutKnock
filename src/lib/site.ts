// Endereço público do site, lido sempre de SITE_URL (nunca escrito no código).
// Aceita "exemplo.pt" ou "https://exemplo.pt/" e devolve sempre "https://exemplo.pt".
// Sem valor ou com um valor inválido, devolve null (quem chama decide o que fazer).
export function parseSiteUrl(value: string | undefined | null): string | null {
  const text = value?.trim();
  if (!text) return null;
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(withScheme);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || !url.hostname) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export const LOCAL_SITE_URL = "http://localhost:3000";

// Para links e metadados: o endereço de SITE_URL ou, sem ele, o local.
export function siteUrl(env: Record<string, string | undefined> = process.env) {
  return parseSiteUrl(env.SITE_URL) ?? LOCAL_SITE_URL;
}

type Env = Record<string, string | undefined>;

// O portfólio que abre na raiz do domínio, lido de HOME_PORTFOLIO_SLUG (nunca escrito no
// código). Sem valor, ou com um valor que não é um endereço de portfólio, a raiz leva à
// entrada, como antes.
export function homePortfolioSlug(env: Env = process.env): string | null {
  const value = env.HOME_PORTFOLIO_SLUG?.trim().toLowerCase();
  return value && /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(value) ? value : null;
}

// O caminho público de um portfólio: a raiz para o de HOME_PORTFOLIO_SLUG, /p/nome para os outros.
export function portfolioPath(slug: string, home: string | null = homePortfolioSlug()) {
  return slug === home ? "/" : `/p/${slug}`;
}

// Para onde reencaminhar um pedido que chegou por um endereço que não é o principal, ou
// null para o deixar seguir. Só quando SITE_URL é um domínio próprio em https:
// - www.<domínio> vai para <domínio>;
// - o endereço de produção <site>.netlify.app vai para <domínio>. As pré-visualizações
//   da Netlify (deploy-preview-1--site, ramo--site: têm sempre "--") e o localhost ficam.
export function canonicalRedirect(host: string | null, pathAndQuery: string, env: Env = process.env): string | null {
  const site = parseSiteUrl(env.SITE_URL);
  if (!site) return null;
  const target = new URL(site);
  if (target.protocol !== "https:" || target.hostname === "localhost" || target.hostname.endsWith(".netlify.app")) {
    return null;
  }

  const name = host?.trim().toLowerCase().replace(/:\d+$/, "");
  if (!name || name === target.hostname) return null;
  const isWww = name === `www.${target.hostname}`;
  const isNetlifyProduction = name.endsWith(".netlify.app") && !name.split(".")[0].includes("--");
  if (!isWww && !isNetlifyProduction) return null;

  const path = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  return `${target.origin}${path}`;
}
