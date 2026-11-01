import { lookup as dnsLookup } from "node:dns";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { BlockList, isIP } from "node:net";
import { analyseHtml, robotsAllows, thirdPartyKind } from "./site-rules";
import type { SiteSignals } from "./types";

export const BOT_NAME = "ScoutKnockBot";

const TIMEOUT_MS = 8000;
const MAX_PAGE_BYTES = 2 * 1024 * 1024;
const MAX_ROBOTS_BYTES = 64 * 1024;
const MAX_REDIRECTS = 3;
const MAX_REQUESTS = 5;
const ALLOWED_PORTS = ["", "80", "443"];
const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".intranet", ".lan", ".home.arpa"];

const blocked = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) {
  blocked.addSubnet(network, prefix, "ipv4");
}
// Sem ::ffff:0:0/96: o BlockList trata esses endereços como IPv4, e a gama bloquearia
// todos. Um endereço como ::ffff:127.0.0.1 já é apanhado pelas regras de IPv4.
for (const [network, prefix] of [
  ["::", 128], ["::1", 128], ["64:ff9b::", 96], ["64:ff9b:1::", 48],
  ["100::", 64], ["2001::", 32], ["2001:db8::", 32], ["2002::", 16], ["fc00::", 7],
  ["fe80::", 10], ["fec0::", 10], ["ff00::", 8],
] as const) {
  blocked.addSubnet(network, prefix, "ipv6");
}

export function isBlockedAddress(address: string) {
  const family = isIP(address);
  if (family === 0) return true;
  return blocked.check(address, family === 4 ? "ipv4" : "ipv6");
}

export type SiteCheckResult =
  | { status: "checked"; site: SiteSignals }
  | { status: "failed" };

export type SiteCheckOptions = {
  userAgent: string;
  signal?: AbortSignal;
  excludedHosts?: string[];
  now?: Date;
  // Só para testes com sites simulados nesta máquina. A produção usa sempre os valores por omissão.
  testing?: { lookup?: Lookup; isBlocked?: (address: string) => boolean; anyPort?: boolean };
};

type Lookup = (hostname: string) => Promise<{ address: string; family: number }[]>;

class CheckFailed extends Error {}

const systemLookup: Lookup = (hostname) =>
  new Promise((resolve, reject) => {
    dnsLookup(hostname, { all: true }, (error, addresses) => {
      if (error) reject(error);
      else resolve(addresses);
    });
  });

function hostOf(url: URL) {
  return url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
}

function matchesHost(host: string, list: string[]) {
  return list.some((item) => host === item || host.endsWith(`.${item}`));
}

function decode(buffer: Buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return buffer.toString("latin1");
  }
}

type Fetched = { status: number; location?: string; contentType: string; body: string };

export async function checkSite(
  website: string,
  { userAgent, signal, excludedHosts = [], now = new Date(), testing }: SiteCheckOptions,
): Promise<SiteCheckResult> {
  const deadline = AbortSignal.timeout(TIMEOUT_MS);
  const stop = signal ? AbortSignal.any([signal, deadline]) : deadline;
  const lookup = testing?.lookup ?? systemLookup;
  const isBlocked = testing?.isBlocked ?? isBlockedAddress;
  let requests = 0;

  function validate(url: URL) {
    const host = hostOf(url);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password ||
      (!testing?.anyPort && !ALLOWED_PORTS.includes(url.port)) ||
      host === "localhost" ||
      BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix)) ||
      matchesHost(host, excludedHosts) ||
      (isIP(host) !== 0 && isBlocked(host))
    ) {
      throw new CheckFailed();
    }
  }

  // Valida cada endereço no momento da ligação, e liga ao que validou: um domínio
  // não consegue responder com um IP público à verificação e um privado à ligação.
  function fetchOnce(url: URL, maxBytes: number): Promise<Fetched> {
    validate(url);
    requests += 1;
    if (requests > MAX_REQUESTS) throw new CheckFailed();

    return new Promise((resolve, reject) => {
      const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(
        url,
        {
          method: "GET",
          agent: false,
          signal: stop,
          // Só estes cabeçalhos: nada do utilizador sai daqui.
          headers: {
            "User-Agent": userAgent,
            Accept: "text/html,text/plain;q=0.9",
            "Accept-Encoding": "identity",
            Connection: "close",
          },
          lookup: (hostname, options, callback) => {
            lookup(hostname)
              .then((addresses) => {
                if (!addresses.length || addresses.some(({ address }) => isBlocked(address))) {
                  throw new CheckFailed();
                }
                if (options.all) callback(null, addresses as never);
                else callback(null, addresses[0].address, addresses[0].family);
              })
              .catch((error) => callback(error, "", 0));
          },
        },
        (response) => {
          const encoding = response.headers["content-encoding"];
          if (encoding && encoding !== "identity") {
            response.destroy();
            reject(new CheckFailed());
            return;
          }

          const chunks: Buffer[] = [];
          let size = 0;
          response.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > maxBytes) {
              response.destroy();
              reject(new CheckFailed());
              return;
            }
            chunks.push(chunk);
          });
          response.on("end", () =>
            resolve({
              status: response.statusCode ?? 0,
              location: response.headers.location,
              contentType: response.headers["content-type"] ?? "",
              body: decode(Buffer.concat(chunks)),
            }),
          );
          response.on("error", reject);
        },
      );
      request.on("error", reject);
      request.end();
    });
  }

  const robotsCache = new Map<string, string | null>();

  // null significa sem regras. Sem conseguir ler as regras, não se visita a página.
  async function robotsFor(url: URL) {
    if (robotsCache.has(url.origin)) return robotsCache.get(url.origin)!;

    let target = new URL("/robots.txt", url);
    let response = await fetchOnce(target, MAX_ROBOTS_BYTES);
    if (response.status >= 300 && response.status < 400 && response.location) {
      const next = new URL(response.location, target);
      if (next.hostname.replace(/^www\./, "") !== target.hostname.replace(/^www\./, "")) {
        throw new CheckFailed();
      }
      target = next;
      response = await fetchOnce(target, MAX_ROBOTS_BYTES);
    }

    if (response.status === 401 || response.status === 403 || response.status >= 500) {
      throw new CheckFailed();
    }
    const rules = response.status >= 200 && response.status < 300 ? response.body : null;
    if (response.status >= 300 && response.status < 400) throw new CheckFailed();
    robotsCache.set(url.origin, rules);
    robotsCache.set(target.origin, rules);
    return rules;
  }

  try {
    let url = new URL(website);
    let responseMs = 0;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      const kind = thirdPartyKind(url.href);
      if (kind) {
        // O site próprio aponta para um terceiro: conclui-se sem o visitar.
        return {
          status: "checked",
          site: {
            isSlow: null,
            isMobileFriendly: null,
            isOutdated: null,
            notOwn: kind,
            observed: { noOwnWebsite: { kind: "thirdParty", thirdParty: kind } },
          },
        };
      }

      validate(url);
      const rules = await robotsFor(url);
      if (rules && !robotsAllows(rules, BOT_NAME, `${url.pathname}${url.search}`)) {
        return { status: "failed" };
      }

      const started = performance.now();
      const page = await fetchOnce(url, MAX_PAGE_BYTES);
      responseMs += performance.now() - started;

      if (page.status >= 300 && page.status < 400 && page.location) {
        url = new URL(page.location, url);
        continue;
      }

      if (page.status !== 200 || !/html/i.test(page.contentType)) {
        return { status: "failed" };
      }

      const site = analyseHtml({
        html: page.body,
        responseMs: Math.round(responseMs),
        isHttps: url.protocol === "https:",
        now,
      });
      return site ? { status: "checked", site } : { status: "failed" };
    }

    return { status: "failed" };
  } catch {
    // Tempo esgotado, erro ou bloqueio: nunca dá pontos, e nem o motivo fica registado.
    return { status: "failed" };
  }
}
