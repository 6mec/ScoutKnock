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
