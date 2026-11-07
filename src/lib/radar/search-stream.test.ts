import { describe, expect, it } from "vitest";
import type { CompanyProvider } from "./provider";
import { OverpassError } from "./overpass-client";
import { runSearch, scoreCompanies } from "./run-search";
import {
  parseSearchQuery,
  readSearchEvents,
  type SearchEvent,
} from "./search-events";
import { SAMPLE_COMPANIES } from "./sample-companies";
import { scoreCompany } from "./score";
import type { Company } from "./types";

const query = {
  service: "website_creation",
  niche: "Barbearias",
  locality: "Porto",
} as const;

function fakeProvider(companies: Company[], failure?: Error): CompanyProvider {
  return {
    usesSampleData: true,
    search: async () => companies,
    findById: async () => null,
    async *stream() {
      for (const company of companies) yield company;
      if (failure) throw failure;
    },
  };
}

async function collect(provider: CompanyProvider, signal?: AbortSignal) {
  const events: SearchEvent[] = [];
  for await (const event of runSearch(provider, query, signal)) events.push(event);
  return events;
}

describe("runSearch", () => {
  it("só dá as notas de scoreCompany e termina com o total", async () => {
    const companies = SAMPLE_COMPANIES.slice(0, 2);
    const events = await collect(fakeProvider(companies));

    const scored = events.filter((event) => event.type === "company");
    expect(scored.map((event) => event.opportunity)).toEqual(
      companies.map((company) => scoreCompany(company, query.service)),
    );
    expect(events.at(-1)).toEqual({ type: "done", count: 2 });
  });

  it("não anuncia o cálculo de notas se não houver empresas", async () => {
    const events = await collect(fakeProvider([]));

    expect(events).not.toContainEqual({
      type: "step",
      step: "scoring",
      status: "active",
    });
    expect(events.at(-1)).toEqual({ type: "done", count: 0 });
  });

  it("transforma a falha do fornecedor num erro sem detalhes", async () => {
    const events = await collect(
      fakeProvider(SAMPLE_COMPANIES.slice(0, 1), new Error("segredo")),
    );

    expect(events.at(-1)).toEqual({ type: "error", code: "provider" });
    expect(JSON.stringify(events)).not.toContain("segredo");
  });

  it("para quando o pedido é cancelado", async () => {
    const controller = new AbortController();
    const seen: SearchEvent[] = [];

    for await (const event of runSearch(
      fakeProvider(SAMPLE_COMPANIES),
      query,
      controller.signal,
    )) {
      seen.push(event);
      if (event.type === "company") controller.abort();
    }

    expect(seen.filter((event) => event.type === "company")).toHaveLength(1);
    expect(seen.some((event) => event.type === "done")).toBe(false);
  });
});

describe("scoreCompanies", () => {
  it("dá a nota a uma lista já pronta (a busca do OpenStreetMap feita no browser)", async () => {
    const companies = SAMPLE_COMPANIES.slice(0, 3);
    const events: SearchEvent[] = [];
    for await (const event of scoreCompanies(companies, query)) events.push(event);
    expect(events.filter((event) => event.type === "company")).toHaveLength(3);
    expect(events.at(-1)).toEqual({ type: "done", count: 3 });
  });

  it("o OpenStreetMap lento dá o erro de tempo; cheio, o de servidores cheios", async () => {
    const codes = [];
    for (const failure of [new OverpassError("timeout"), new OverpassError("busy", 504)]) {
      const events = await collect(fakeProvider([], failure));
      codes.push(events.at(-1));
    }
    expect(codes).toEqual([
      { type: "error", code: "timeout" },
      { type: "error", code: "busy" },
    ]);
  });
});

describe("parseSearchQuery", () => {
  it("limpa e limita os filtros", () => {
    const parsed = parseSearchQuery({
      ...query,
      niche: `  ${"a".repeat(200)} `,
    });

    expect(parsed?.niche).toHaveLength(80);
  });

  it.each([
    null,
    "texto",
    { ...query, service: "outro" },
    { ...query, niche: "   " },
    { ...query, locality: 3 },
  ])("rejeita %j", (body) => {
    expect(parseSearchQuery(body)).toBeNull();
  });
});

describe("readSearchEvents", () => {
  it("junta linhas cortadas entre pedaços", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('{"type":"do'));
        controller.enqueue(encoder.encode('ne","count":1}\n{"type":"done",'));
        controller.enqueue(encoder.encode('"count":2}\n'));
        controller.close();
      },
    });
    const events: SearchEvent[] = [];

    await readSearchEvents(body, (event) => events.push(event));

    expect(events).toEqual([
      { type: "done", count: 1 },
      { type: "done", count: 2 },
    ]);
  });
});
