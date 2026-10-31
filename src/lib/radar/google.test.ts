import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { startOfLisbonDay, startOfLisbonMonth } from "@/lib/lisbon-time";
import {
  parseGoogleConfig,
  spendGoogleCall,
  type GoogleConfig,
  type SpendResult,
} from "./google-budget";
import {
  createGoogleProvider,
  placeToCompany,
  type GooglePlace,
} from "./google-provider";
import { getCompanyProvider } from "./provider";
import { runSearch } from "./run-search";
import type { SearchEvent } from "./search-events";

const query = {
  service: "website_creation",
  niche: "Barbearias",
  locality: "Porto",
} as const;

const config: GoogleConfig = {
  apiKey: "chave-secreta-de-teste",
  dailyBudgetEur: 1,
  monthlyBudgetEur: 20,
  costEur: { text_search: 0.035, place_details: 0.02 },
  maxPages: 1,
};

const place: GooglePlace = {
  id: "abc_1",
  displayName: { text: "Barbearia Real" },
  formattedAddress: "Rua A, Porto",
  internationalPhoneNumber: "+351 900 000 001",
  userRatingCount: 5,
  businessStatus: "OPERATIONAL",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function setup(
  responses: Response[],
  spend: () => Promise<SpendResult> = async () => "ok",
  maxPages = 1,
) {
  const fetcher = vi.fn(async () => {
    const next = responses.shift();
    if (!next) throw new Error("chamada a mais");
    return next;
  });
  const onCall = vi.fn();
  const provider = createGoogleProvider({
    config: { ...config, maxPages },
    spend,
    onCall,
    fetcher: fetcher as unknown as typeof fetch,
  });
  return { provider, fetcher, onCall };
}

async function events(provider: ReturnType<typeof setup>["provider"]) {
  const list: SearchEvent[] = [];
  for await (const event of runSearch(provider, query)) list.push(event);
  return list;
}

describe("configuração do Google", () => {
  const full = {
    GOOGLE_PLACES_API_KEY: "k",
    GOOGLE_DAILY_BUDGET_EUR: "1",
    GOOGLE_MONTHLY_BUDGET_EUR: "20",
    GOOGLE_TEXT_SEARCH_COST_EUR: "0.035",
    GOOGLE_PLACE_DETAILS_COST_EUR: "0.02",
  };

  it("lê tetos e custos, com uma página por omissão", () => {
    expect(parseGoogleConfig(full)).toEqual({
      apiKey: "k",
      dailyBudgetEur: 1,
      monthlyBudgetEur: 20,
      costEur: { text_search: 0.035, place_details: 0.02 },
      maxPages: 1,
    });
  });

  it("não aceita páginas acima do máximo", () => {
    expect(
      parseGoogleConfig({ ...full, GOOGLE_MAX_PAGES_PER_SEARCH: "50" })?.maxPages,
    ).toBe(3);
    expect(
      parseGoogleConfig({ ...full, GOOGLE_MAX_PAGES_PER_SEARCH: "x" })?.maxPages,
    ).toBe(1);
  });

  it.each([
    "GOOGLE_DAILY_BUDGET_EUR",
    "GOOGLE_MONTHLY_BUDGET_EUR",
    "GOOGLE_TEXT_SEARCH_COST_EUR",
    "GOOGLE_PLACE_DETAILS_COST_EUR",
  ])("sem %s, não arranca", (name) => {
    expect(parseGoogleConfig({ ...full, [name]: "" })).toBeNull();
    expect(parseGoogleConfig({ ...full, [name]: "abc" })).toBeNull();
  });

  it("custo a 0 não conta como configurado, teto a 0 sim", () => {
    expect(
      parseGoogleConfig({ ...full, GOOGLE_TEXT_SEARCH_COST_EUR: "0" }),
    ).toBeNull();
    expect(
      parseGoogleConfig({ ...full, GOOGLE_DAILY_BUDGET_EUR: "0" })?.dailyBudgetEur,
    ).toBe(0);
  });

  it("escolhe o fornecedor certo conforme a chave", () => {
    expect(
      getCompanyProvider({ env: { NODE_ENV: "development" } })?.usesSampleData,
    ).toBe(true);
    expect(getCompanyProvider({ env: { ...full, NODE_ENV: "production" } })?.usesSampleData).toBe(false);
    expect(
      getCompanyProvider({
        env: { NODE_ENV: "development", GOOGLE_PLACES_API_KEY: "k" },
      }),
    ).toBeNull();
  });
});

describe("travão de custo", () => {
  const now = new Date("2026-11-20T12:00:00Z");

  function fakeDb(rows: { created_at: string; cost_eur: number }[], fail = false) {
    const stored = [...rows];
    const insert = vi.fn(async (row: { cost_eur: number }) => {
      stored.push({ created_at: now.toISOString(), cost_eur: row.cost_eur });
      return { error: null };
    });
    const range = vi.fn(async (from: number, to: number) =>
      fail
        ? { data: null, error: { code: "x" } }
        : { data: stored.slice(from, to + 1), error: null },
    );
    const chain = { eq: () => chain, gte: () => chain, order: () => chain, range };
    const db = { from: () => ({ insert, select: () => chain }) };
    return { db: db as unknown as SupabaseClient, insert, range };
  }

  const today = now.toISOString();
  const earlier = "2026-11-03T12:00:00Z";

  it("regista a chamada com o custo configurado e o utilizador", async () => {
    const { db, insert } = fakeDb([]);
    expect(await spendGoogleCall(db, config, "text_search", "u", now)).toBe("ok");
    expect(insert).toHaveBeenCalledWith({
      user_id: "u",
      provider: "google_places",
      kind: "text_search",
      units: 1,
      cost_eur: 0.035,
    });
  });

  it("bloqueia pelo teto diário, sem registar", async () => {
    const { db, insert } = fakeDb([{ created_at: today, cost_eur: 0.98 }]);
    expect(await spendGoogleCall(db, config, "text_search", "u", now)).toBe("over");
    expect(insert).not.toHaveBeenCalled();
  });

  it("gastos de outros dias não contam para o teto diário", async () => {
    const { db } = fakeDb([{ created_at: earlier, cost_eur: 5 }]);
    expect(await spendGoogleCall(db, config, "text_search", "u", now)).toBe("ok");
  });

  it("bloqueia pelo teto mensal, mesmo com o dia livre", async () => {
    const { db, insert } = fakeDb([{ created_at: earlier, cost_eur: 19.99 }]);
    expect(await spendGoogleCall(db, config, "text_search", "u", now)).toBe("over");
    expect(insert).not.toHaveBeenCalled();
  });

  it("teto a 0 bloqueia tudo", async () => {
    const { db } = fakeDb([]);
    expect(
      await spendGoogleCall(db, { ...config, dailyBudgetEur: 0 }, "place_details", "u", now),
    ).toBe("over");
  });

  it("soma além das primeiras mil linhas", async () => {
    const rows = Array.from({ length: 2500 }, () => ({
      created_at: earlier,
      cost_eur: 0.008,
    }));
    const { db, insert, range } = fakeDb(rows);
    expect(await spendGoogleCall(db, config, "text_search", "u", now)).toBe("over");
    expect(range).toHaveBeenCalledTimes(3);
    expect(insert).not.toHaveBeenCalled();
  });

  it("apanha pedidos em simultâneo na segunda contagem", async () => {
    const concurrent = fakeDb([{ created_at: today, cost_eur: 0.96 }]);
    concurrent.insert.mockImplementationOnce(async () => {
      concurrent.range.mockImplementationOnce(async () => ({
        data: [{ created_at: today, cost_eur: 1.1 }],
        error: null,
      }));
      return { error: null };
    });
    expect(
      await spendGoogleCall(concurrent.db, config, "text_search", "u", now),
    ).toBe("over");
  });

  it("se não conseguir ler os gastos, não deixa chamar", async () => {
    const { db, insert } = fakeDb([], true);
    expect(await spendGoogleCall(db, config, "text_search", "u", now)).toBe("error");
    expect(insert).not.toHaveBeenCalled();
  });

  it("o mês começa no dia 1 em Lisboa", () => {
    expect(startOfLisbonMonth(now)).toBe("2026-11-01T00:00:00.000Z");
    expect(startOfLisbonDay(now)).toBe("2026-11-20T00:00:00.000Z");
  });
});

describe("conversão da resposta do Google", () => {
  it("usa os campos públicos e deixa por verificar os sinais do site", () => {
    expect(placeToCompany(place, "Barbearias", "Porto")).toEqual({
      id: "abc_1",
      name: "Barbearia Real",
      niche: "Barbearias",
      locality: "Porto",
      address: "Rua A, Porto",
      phone: "+351 900 000 001",
      website: null,
      reviewCount: 5,
      hasOpeningHours: false,
      site: { isSlow: null, isMobileFriendly: null, isOutdated: null },
    });
  });

  it("aguenta campos em falta", () => {
    const company = placeToCompany(
      { id: "x", displayName: { text: "Sem mais nada" } },
      "N",
      "L",
    );
    expect(company).toMatchObject({
      address: "",
      phone: null,
      website: null,
      reviewCount: 0,
      hasOpeningHours: false,
    });
  });

  it("ignora empresas sem id, sem nome ou fechadas de vez", () => {
    expect(placeToCompany({ displayName: { text: "A" } }, "N", "L")).toBeNull();
    expect(placeToCompany({ id: "x" }, "N", "L")).toBeNull();
    expect(
      placeToCompany({ ...place, businessStatus: "CLOSED_PERMANENTLY" }, "N", "L"),
    ).toBeNull();
  });
});

describe("fornecedor Google com respostas simuladas", () => {
  it("faz o pedido certo, com a chave só no cabeçalho", async () => {
    const { provider, fetcher } = setup([json({ places: [place] })]);
    await events(provider);

    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(url).toBe("https://places.googleapis.com/v1/places:searchText");
    expect(url).not.toContain(config.apiKey);
    expect(init.body).not.toContain(config.apiKey);
    expect(headers["X-Goog-Api-Key"]).toBe(config.apiKey);
    expect(headers["X-Goog-FieldMask"]).not.toContain("*");
    expect(headers["X-Goog-FieldMask"]).toContain("places.websiteUri");
    expect(JSON.parse(init.body as string)).toEqual({
      textQuery: "Barbearias em Porto",
      pageSize: 20,
      languageCode: "pt-PT",
    });
  });

  it("devolve empresas com nota e conta uma chamada", async () => {
    const { provider, onCall } = setup([json({ places: [place] })]);
    const list = await events(provider);
    const company = list.find((event) => event.type === "company");
    expect(company).toMatchObject({ opportunity: { score: 100 } });
    expect(list.at(-1)).toEqual({ type: "done", count: 1 });
    expect(onCall).toHaveBeenCalledTimes(1);
  });

  it("sem resultados termina limpo", async () => {
    const { provider } = setup([json({})]);
    expect((await events(provider)).at(-1)).toEqual({ type: "done", count: 0 });
  });

  it("erro da API é erro do fornecedor, sem expor a chave", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { provider } = setup([json({ error: "x" }, 403)]);
    expect((await events(provider)).at(-1)).toEqual({
      type: "error",
      code: "provider",
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain(config.apiKey);
    log.mockRestore();
  });

  it("teto atingido não chama o Google e dá erro próprio", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { provider, fetcher, onCall } = setup([], async () => "over");
    expect((await events(provider)).at(-1)).toEqual({
      type: "error",
      code: "budget",
    });
    expect(fetcher).not.toHaveBeenCalled();
    expect(onCall).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("falha do registo também não chama o Google", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { provider, fetcher } = setup([], async () => "error");
    await events(provider);
    expect(fetcher).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("por omissão não pede a segunda página, que é paga", async () => {
    const { provider, fetcher } = setup([
      json({ places: [place], nextPageToken: "seguinte" }),
    ]);
    await events(provider);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("com mais páginas, conta cada chamada e passa o token", async () => {
    const { provider, fetcher, onCall } = setup(
      [
        json({ places: [place], nextPageToken: "seguinte" }),
        json({ places: [{ ...place, id: "abc_2" }] }),
      ],
      undefined,
      3,
    );
    const list = await events(provider);
    expect(list.at(-1)).toEqual({ type: "done", count: 2 });
    expect(onCall).toHaveBeenCalledTimes(2);
    const second = fetcher.mock.calls[1] as unknown as [string, RequestInit];
    expect(JSON.parse(second[1].body as string).pageToken).toBe("seguinte");
  });

  it("teto atingido a meio mantém os resultados que já há", async () => {
    const results: SpendResult[] = ["ok", "over"];
    const { provider } = setup(
      [json({ places: [place], nextPageToken: "seguinte" })],
      async () => results.shift() ?? "over",
      3,
    );
    expect((await events(provider)).at(-1)).toEqual({ type: "done", count: 1 });
  });

  it("detalhes usam o tipo e a localidade do Google", async () => {
    const { provider, fetcher } = setup([
      json({
        ...place,
        primaryTypeDisplayName: { text: "Barbearia" },
        addressComponents: [
          { longText: "Rua A", types: ["route"] },
          { longText: "Porto", types: ["locality"] },
        ],
      }),
    ]);
    expect(await provider.findById("abc_1")).toMatchObject({
      niche: "Barbearia",
      locality: "Porto",
    });
    const [url] = fetcher.mock.calls[0] as unknown as [string];
    expect(url).toContain("/places/abc_1?");
  });

  it("detalhes não rebentam a ação: erro, teto ou id estranho dão null", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await setup([json({}, 500)]).provider.findById("abc")).toBeNull();
    expect(await setup([], async () => "over").provider.findById("abc")).toBeNull();

    const odd = setup([]);
    expect(await odd.provider.findById("../outro?x=1")).toBeNull();
    expect(odd.fetcher).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
