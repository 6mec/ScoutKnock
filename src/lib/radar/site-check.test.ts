import { createServer, type RequestListener, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sampleProvider, type CompanyProvider } from "./provider";
import { runSearch } from "./run-search";
import { scoreCompany } from "./score";
import { claimHost, parseSiteCheckConfig, reserveSiteChecks } from "./site-budget";
import { checkSite, isBlockedAddress, type SiteCheckOptions } from "./site-check";
import { analyseHtml, robotsAllows, thirdPartyKind } from "./site-rules";
import type { Company } from "./types";

const NOW = new Date("2026-11-01T12:00:00Z");
const FILLER = "Texto sobre a empresa e os seus serviços. ".repeat(10);
const page = (head: string, body = FILLER) =>
  `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
const VIEWPORT = '<meta name="viewport" content="width=device-width">';

const received: { url: string; headers: Record<string, unknown> }[] = [];
let robots = "";

const routes: Record<string, RequestListener> = {
  "/rapido": (_req, res) => {
    res.setHeader("content-type", "text/html");
    res.end(page(VIEWPORT, `${FILLER}© 2026`));
  },
  "/lento": (_req, res) => {
    setTimeout(() => {
      res.setHeader("content-type", "text/html");
      res.end(page(VIEWPORT));
    }, 4200);
  },
  "/sem-viewport": (_req, res) => {
    res.setHeader("content-type", "text/html");
    res.end(page(""));
  },
  "/antigo": (_req, res) => {
    res.setHeader("content-type", "text/html");
    res.end(page(VIEWPORT, `${FILLER}<footer>&copy; 2018 Empresa</footer>`));
  },
  "/nunca": () => {},
  "/enorme": (_req, res) => {
    res.setHeader("content-type", "text/html");
    res.write(page(VIEWPORT));
    res.end("x".repeat(3 * 1024 * 1024));
  },
  "/proibido": (_req, res) => {
    res.statusCode = 403;
    res.setHeader("content-type", "text/html");
    res.end(page(VIEWPORT));
  },
  "/para-privado": (_req, res) => {
    res.statusCode = 302;
    res.setHeader("location", "http://169.254.169.254/latest/meta-data");
    res.end();
  },
  "/para-instagram": (_req, res) => {
    res.statusCode = 301;
    res.setHeader("location", "https://www.instagram.com/empresa");
    res.end();
  },
  "/ciclo": (req, res) => {
    res.statusCode = 302;
    res.setHeader("location", req.url!);
    res.end();
  },
  "/estacionado": (_req, res) => {
    res.setHeader("content-type", "text/html");
    res.end(page(VIEWPORT, "This domain is for sale. Buy this domain today."));
  },
  "/imagem": (_req, res) => {
    res.setHeader("content-type", "image/png");
    res.end("x");
  },
};

let server: Server;
let base: string;

beforeAll(async () => {
  server = createServer((req, res) => {
    const path = req.url!.split("?")[0];
    received.push({ url: req.url!, headers: req.headers });
    if (path === "/robots.txt") {
      res.setHeader("content-type", "text/plain");
      res.end(robots);
      return;
    }
    (routes[path] ?? ((_q, r) => { r.statusCode = 404; r.end(); }))(req, res);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.closeAllConnections();
  server.close();
});

// O guardião verdadeiro bloqueia esta máquina: só os sites simulados o dispensam.
const options = (extra: Partial<SiteCheckOptions> = {}): SiteCheckOptions => ({
  userAgent: "ScoutKnockBot/1.0 (+https://exemplo.pt/bot)",
  now: NOW,
  testing: { anyPort: true, isBlocked: (ip) => ip === "169.254.169.254" },
  ...extra,
});

describe("sites simulados", () => {
  it("site rápido e atual não dá sinais", async () => {
    robots = "";
    const result = await checkSite(`${base}/rapido`, options());
    expect(result).toMatchObject({
      status: "checked",
      site: { isSlow: false, isMobileFriendly: true },
    });
  });

  it("marca como lento acima de 4 s, com o tempo observado", async () => {
    const result = await checkSite(`${base}/lento`, options());
    expect(result).toMatchObject({ status: "checked", site: { isSlow: true } });
    if (result.status === "checked") {
      expect(result.site.observed?.slowSite).toMatchObject({ kind: "responseTime" });
    }
  }, 10_000);

  it("deteta a falta de viewport", async () => {
    const result = await checkSite(`${base}/sem-viewport`, options());
    expect(result).toMatchObject({ site: { isMobileFriendly: false } });
  });

  it("deteta o copyright antigo", async () => {
    const result = await checkSite(`${base}/antigo`, options());
    expect(result).toMatchObject({
      site: { isOutdated: true, observed: { outdatedSite: { kind: "copyright", year: 2018 } } },
    });
  });

  it("tempo esgotado falha e não conta como lento", async () => {
    const started = Date.now();
    const result = await checkSite(`${base}/nunca`, options());
    expect(result).toEqual({ status: "failed" });
    expect(Date.now() - started).toBeLessThan(9000);
  }, 12_000);

  it("resposta enorme falha", async () => {
    expect(await checkSite(`${base}/enorme`, options())).toEqual({ status: "failed" });
  });

  it("403, conteúdo não HTML e redirecionamentos em ciclo falham", async () => {
    expect(await checkSite(`${base}/proibido`, options())).toEqual({ status: "failed" });
    expect(await checkSite(`${base}/imagem`, options())).toEqual({ status: "failed" });
    expect(await checkSite(`${base}/ciclo`, options())).toEqual({ status: "failed" });
  });

  it("não segue um redirecionamento para IP privado", async () => {
    received.length = 0;
    expect(await checkSite(`${base}/para-privado`, options())).toEqual({ status: "failed" });
  });

  it("o robots.txt proíbe e a página não é pedida", async () => {
    robots = "User-agent: ScoutKnockBot\nDisallow: /";
    received.length = 0;
    expect(await checkSite(`${base}/rapido`, options())).toEqual({ status: "failed" });
    expect(received.map((item) => item.url)).toEqual(["/robots.txt"]);
    robots = "";
  });

  it("redirecionamento para rede social dá sem site próprio, sem a visitar", async () => {
    const result = await checkSite(`${base}/para-instagram`, options());
    expect(result).toMatchObject({ status: "checked", site: { notOwn: "social" } });
  });

  it("domínio estacionado dá sem site próprio", async () => {
    const result = await checkSite(`${base}/estacionado`, options());
    expect(result).toMatchObject({ status: "checked", site: { notOwn: "parked" } });
  });

  it("envia só os cabeçalhos próprios, com a página do robô", async () => {
    received.length = 0;
    await checkSite(`${base}/rapido`, options());
    const { headers } = received.at(-1)!;
    expect(headers["user-agent"]).toContain("/bot");
    expect(headers.cookie).toBeUndefined();
    expect(headers.authorization).toBeUndefined();
    expect(received.length).toBeLessThanOrEqual(5);
  });

  it("um domínio excluído não recebe pedidos", async () => {
    received.length = 0;
    const result = await checkSite(`${base}/rapido`, options({ excludedHosts: ["127.0.0.1"] }));
    expect(result).toEqual({ status: "failed" });
    expect(received).toEqual([]);
  });

  it("cancelar para a verificação", async () => {
    const controller = new AbortController();
    const running = checkSite(`${base}/nunca`, options({ signal: controller.signal }));
    setTimeout(() => controller.abort(), 50);
    expect(await running).toEqual({ status: "failed" });
  });
});

describe("proteção contra SSRF, com o guardião verdadeiro", () => {
  const real = { userAgent: "x", now: NOW };

  it.each([
    "127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1",
    "0.0.0.0", "224.0.0.1", "::1", "fe80::1", "fc00::1", "::ffff:127.0.0.1", "nome",
  ])("bloqueia %s", (address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it("deixa passar endereços públicos", () => {
    expect(isBlockedAddress("8.8.8.8")).toBe(false);
    expect(isBlockedAddress("2606:4700:4700::1111")).toBe(false);
  });

  it.each([
    "http://localhost/", "http://127.0.0.1/", "http://127.1/", "http://0x7f.0.0.1/",
    "http://2130706433/", "http://[::1]/", "http://[::ffff:7f00:1]/",
    "http://servidor.local/", "http://intranet.internal/", "ftp://exemplo.pt/",
    "file:///etc/passwd", "http://user:pw@exemplo.pt/", "http://exemplo.pt:8080/",
    "isto não é um endereço",
  ])("recusa %s", async (url) => {
    expect(await checkSite(url, real)).toEqual({ status: "failed" });
  });

  it("recusa um domínio que resolve para IP privado, sem lhe ligar", async () => {
    received.length = 0;
    const result = await checkSite(`${base.replace("127.0.0.1", "armadilha.exemplo.pt")}/rapido`, {
      ...real,
      testing: {
        anyPort: true,
        lookup: async () => [{ address: "127.0.0.1", family: 4 }],
      },
    });
    expect(result).toEqual({ status: "failed" });
    expect(received).toEqual([]);
  });

  it("recusa se um dos endereços do domínio for privado", async () => {
    received.length = 0;
    const result = await checkSite(`${base.replace("127.0.0.1", "misto.exemplo.pt")}/rapido`, {
      ...real,
      testing: {
        anyPort: true,
        lookup: async () => [
          { address: "8.8.8.8", family: 4 },
          { address: "127.0.0.1", family: 4 },
        ],
      },
    });
    expect(result).toEqual({ status: "failed" });
    expect(received).toEqual([]);
  });
});

describe("regras", () => {
  it.each([
    ["https://www.instagram.com/x", "social"],
    ["https://m.facebook.com/x", "social"],
    ["https://linktr.ee/x", "linkPage"],
    ["https://booksy.com/pt-pt/x", "booking"],
    ["https://www.thefork.pt/x", "booking"],
    ["https://sedo.com/x", "parked"],
  ])("%s é de terceiros", (url, kind) => {
    expect(thirdPartyKind(url)).toBe(kind);
  });

  it.each(["https://barbearia.pt", "https://instagram.com.fraude.pt", "https://notx.com"])(
    "%s é próprio",
    (url) => {
      expect(thirdPartyKind(url)).toBeNull();
    },
  );

  const analyse = (html: string, isHttps = true) =>
    analyseHtml({ html, responseMs: 100, isHttps, now: NOW });

  it("não tira conclusões de páginas de bloqueio nem de texto solto", () => {
    expect(analyse(page("<title>Just a moment...</title>"))).toBeNull();
    expect(analyse("sem marcação")).toBeNull();
  });

  it("página montada por JavaScript não é acusada de não ter versão móvel", () => {
    expect(analyse(page("", '<div id="app"></div>'))?.isMobileFriendly).toBeNull();
  });

  it("copyright: usa o ano mais recente, e ignora scripts e comentários", () => {
    expect(analyse(page(VIEWPORT, `${FILLER}© 2015-2026`))?.isOutdated).toBe(false);
    expect(analyse(page(VIEWPORT, `${FILLER}© 2023`))?.isOutdated).toBe(false);
    expect(analyse(page(VIEWPORT, `${FILLER}© 2022`))?.isOutdated).toBe(true);
    expect(
      analyse(page(VIEWPORT, `${FILLER}<!-- © 2010 --><script>"© 2010"</script>`))?.isOutdated,
    ).toBe(false);
  });

  it("deteta tecnologias obsoletas e a falta de HTTPS", () => {
    expect(analyse(page(VIEWPORT, `${FILLER}<marquee>x</marquee>`))?.observed?.outdatedSite)
      .toEqual({ kind: "legacyTech", tech: "marquee" });
    expect(analyse(page(VIEWPORT), false)?.observed?.outdatedSite).toEqual({ kind: "noHttps" });
  });

  it("um site a sério que fala de domínios à venda não é estacionado", () => {
    const long = "Registamos domínios. ".repeat(200);
    expect(analyse(page(VIEWPORT, `${long} This domain is for sale.`))?.notOwn).toBeUndefined();
  });

  it("robots.txt: o nosso grupo ganha, e a regra mais longa também", () => {
    const rules = "User-agent: *\nDisallow: /\n\nUser-agent: ScoutKnockBot\nAllow: /\nDisallow: /privado";
    expect(robotsAllows(rules, "ScoutKnockBot", "/")).toBe(true);
    expect(robotsAllows(rules, "ScoutKnockBot", "/privado/x")).toBe(false);
    expect(robotsAllows("User-agent: *\nDisallow: /", "ScoutKnockBot", "/")).toBe(false);
    expect(robotsAllows("User-agent: *\nDisallow:", "ScoutKnockBot", "/")).toBe(true);
    expect(robotsAllows("", "ScoutKnockBot", "/")).toBe(true);
  });
});

describe("honestidade da nota", () => {
  const company: Company = {
    id: "c",
    name: "Empresa",
    niche: "n",
    locality: "l",
    address: "a",
    website: "https://empresa.pt",
    reviewCount: 100,
    hasOpeningHours: true,
    site: { isSlow: null, isMobileFriendly: null, isOutdated: null },
  };

  it("sem verificação, não há pontos nem motivos do site", () => {
    expect(scoreCompany(company, "website_creation")).toMatchObject({ score: 0, reasons: [] });
  });

  it("mantém os valores e mostra o observado", () => {
    const { score, reasons } = scoreCompany(
      {
        ...company,
        site: {
          isSlow: true,
          isMobileFriendly: false,
          isOutdated: true,
          observed: {
            slowSite: { kind: "responseTime", ms: 5200 },
            notMobileFriendly: { kind: "noViewport" },
            outdatedSite: { kind: "copyright", year: 2018 },
          },
        },
      },
      "website_creation",
    );
    expect(score).toBe(70);
    expect(reasons[0]).toEqual({
      code: "slowSite",
      points: 25,
      observed: { kind: "responseTime", ms: 5200 },
    });
  });

  it("endereço de rede social vale como sem site próprio, com motivo visível", () => {
    const { score, reasons } = scoreCompany(
      { ...company, website: "https://instagram.com/empresa" },
      "website_creation",
    );
    expect(score).toBe(70);
    expect(reasons).toEqual([
      {
        code: "noOwnWebsite",
        points: 70,
        observed: { kind: "thirdParty", thirdParty: "social" },
      },
    ]);
  });
});

describe("limites", () => {
  it("sem interruptor, teto ou endereço público, fica desligada", () => {
    const valid = {
      SITE_CHECKS_ENABLED: "true",
      SITE_CHECKS_DAILY_LIMIT: "100",
      SITE_URL: "https://exemplo.pt",
    };
    expect(parseSiteCheckConfig(valid)?.userAgent).toBe(
      "ScoutKnockBot/1.0 (+https://exemplo.pt/bot)",
    );
    expect(parseSiteCheckConfig(valid)?.perSearch).toBe(8);
    expect(parseSiteCheckConfig({ ...valid, SITE_CHECKS_PER_SEARCH: "50" })?.perSearch).toBe(8);
    expect(parseSiteCheckConfig({ ...valid, SITE_CHECKS_ENABLED: "" })).toBeNull();
    expect(parseSiteCheckConfig({ ...valid, SITE_CHECKS_DAILY_LIMIT: "" })).toBeNull();
    expect(parseSiteCheckConfig({ ...valid, SITE_CHECKS_DAILY_LIMIT: "0" })).toBeNull();
    expect(parseSiteCheckConfig({ ...valid, SITE_URL: "" })).toBeNull();
    expect(
      parseSiteCheckConfig({ ...valid, SITE_URL: "http://exemplo.pt", NODE_ENV: "production" }),
    ).toBeNull();
  });

  it("não repete pedidos seguidos ao mesmo site", () => {
    const now = 1_000_000;
    expect(claimHost("https://www.repetido.pt/a", now)).toBe(true);
    expect(claimHost("https://repetido.pt/b", now + 1000)).toBe(false);
    expect(claimHost("https://outro-repetido.pt", now + 1000)).toBe(true);
    expect(claimHost("https://repetido.pt", now + 60_000)).toBe(true);
  });

  function fakeDb(used: number, { failInsert = false } = {}) {
    const rows = [{ units: used }];
    return {
      rows,
      from: () => ({
        select: () => ({
          eq: () => ({
            gte: () => ({
              order: () => ({ range: async () => ({ data: rows, error: null }) }),
            }),
          }),
        }),
        insert: async (row: { units: number }) => {
          if (failInsert) return { error: { code: "x" } };
          rows.push({ units: row.units });
          return { error: null };
        },
      }),
    };
  }

  it("respeita o teto diário e, se a base de dados falhar, não visita", async () => {
    const reserve = (db: unknown, wanted: number) =>
      reserveSiteChecks(db as never, 10, wanted, "search", undefined, NOW);
    expect(await reserve(fakeDb(0), 8)).toBe(8);
    expect(await reserve(fakeDb(7), 8)).toBe(3);
    expect(await reserve(fakeDb(10), 8)).toBe(0);
    expect(await reserve(fakeDb(0, { failInsert: true }), 8)).toBe(0);
  });
});

describe("busca com verificação", () => {
  const companies = Array.from({ length: 12 }, (_, index): Company => ({
    id: `c${index}`,
    name: `Empresa ${index}`,
    niche: "n",
    locality: "l",
    address: "a",
    website: index === 11 ? "https://instagram.com/x" : `https://site${index}.pt`,
    reviewCount: 100,
    hasOpeningHours: true,
    site: { isSlow: null, isMobileFriendly: null, isOutdated: null },
  }));
  const provider: CompanyProvider = {
    ...sampleProvider,
    usesSampleData: false,
    async *stream() {
      yield* companies;
    },
  };
  const query = { service: "website_creation", niche: "n", locality: "l" } as const;

  it("mostra os resultados primeiro e verifica no máximo 8, 3 de cada vez", async () => {
    let active = 0;
    let peak = 0;
    const events = [];
    for await (const event of runSearch(provider, query, undefined, {
      perSearch: 8,
      reserve: async (wanted) => wanted,
      check: async (website) => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return website.includes("site1.")
          ? { status: "failed" }
          : {
              status: "checked",
              site: { isSlow: true, isMobileFriendly: true, isOutdated: false },
            };
      },
    })) {
      events.push(event);
    }

    const types = events.map((event) => event.type);
    expect(types.lastIndexOf("company")).toBeLessThan(types.indexOf("done"));
    expect(types.indexOf("done")).toBeLessThan(types.indexOf("sites_start"));
    expect(peak).toBeLessThanOrEqual(3);
    expect(events.at(-1)).toEqual({ type: "sites_done", checked: 7, failed: 1, skipped: 3 });

    const failed = events.find((event) => event.type === "site" && event.status === "failed");
    expect(failed).toEqual({ type: "site", id: "c1", status: "failed" });
    const checked = events.find((event) => event.type === "site" && event.status === "checked");
    expect(checked).toMatchObject({ opportunity: { score: 25 } });
  });

  it("sem verificador, ou com dados de exemplo, a busca não visita nada", async () => {
    const without = [];
    for await (const event of runSearch(provider, query)) without.push(event.type);
    expect(without.at(-1)).toBe("done");

    const sample = [];
    for await (const event of runSearch(sampleProvider, { ...query, niche: "barb", locality: "porto" }, undefined, {
      perSearch: 8,
      reserve: async () => {
        throw new Error("não devia reservar");
      },
      check: async () => {
        throw new Error("não devia visitar");
      },
    })) {
      sample.push(event.type);
    }
    expect(sample.at(-1)).toBe("done");
  });

  it("se o teto estiver esgotado, os resultados chegam e nada é visitado", async () => {
    const events = [];
    for await (const event of runSearch(provider, query, undefined, {
      perSearch: 8,
      reserve: async () => 0,
      check: async () => {
        throw new Error("não devia visitar");
      },
    })) {
      events.push(event);
    }
    expect(events.at(-1)).toEqual({ type: "sites_done", checked: 0, failed: 0, skipped: 11 });
  });

  it("uma verificação que rebenta conta como falha", async () => {
    const events = [];
    for await (const event of runSearch(provider, query, undefined, {
      perSearch: 1,
      reserve: async (wanted) => wanted,
      check: async () => {
        throw new Error("x");
      },
    })) {
      events.push(event);
    }
    expect(events.at(-1)).toMatchObject({ type: "sites_done", failed: 1, checked: 0 });
  });
});
