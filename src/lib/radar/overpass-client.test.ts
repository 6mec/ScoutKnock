import { describe, expect, it, vi } from "vitest";
import { OVERPASS_ENDPOINTS, OverpassError, runOverpassQuery, searchOverpass, type OverpassProgress } from "./overpass-client";

const ok = (elements: unknown[], extra: Record<string, unknown> = {}) =>
  new Response(JSON.stringify({ elements, ...extra }), { status: 200 });
const busy = () => new Response("cheio", { status: 504 });
const named = (id: number) => ({ type: "node", id, tags: { name: `E${id}` } });
const noSleep = vi.fn(async () => {});

describe("pedido ao Overpass", () => {
  it("um servidor cheio passa ao seguinte, um de cada vez, e diz qual está a tentar", async () => {
    const progress: OverpassProgress[] = [];
    const fetchImpl = vi.fn().mockResolvedValueOnce(busy()).mockResolvedValueOnce(ok([named(1)]));
    const elements = await runOverpassQuery("q", { fetchImpl, onProgress: (p) => progress.push(p), sleep: noSleep });
    expect(elements).toHaveLength(1);
    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual(OVERPASS_ENDPOINTS.slice(0, 2));
    expect(progress).toEqual([
      { type: "server", server: 1, servers: 3 },
      { type: "server", server: 2, servers: 3 },
    ]);
    const init = fetchImpl.mock.calls[0][1] as RequestInit;
    expect(new URLSearchParams(String(init.body)).get("data")).toBe("q");
  });

  it("só depois de todos falharem espera e dá uma segunda volta; depois desiste", async () => {
    const progress: OverpassProgress[] = [];
    const sleep = vi.fn(async () => {});
    const fetchImpl = vi.fn().mockImplementation(async () => busy());
    const error = await runOverpassQuery("q", { fetchImpl, sleep, onProgress: (p) => progress.push(p) }).catch((e) => e);
    expect(error).toBeInstanceOf(OverpassError);
    expect(error.code).toBe("busy");
    expect(fetchImpl).toHaveBeenCalledTimes(OVERPASS_ENDPOINTS.length * 2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(progress).toContainEqual({ type: "wait", seconds: 10 });
  });

  it("o aviso de tempo esgotado do Overpass conta como falha de tempo", async () => {
    const fetchImpl = vi.fn().mockImplementation(async () =>
      ok([], { remark: "runtime error: Query timed out in \"query\" at line 1 after 26 seconds." }),
    );
    const error = await runOverpassQuery("q", { fetchImpl, rounds: 1, sleep: noSleep }).catch((e) => e);
    expect(error.code).toBe("timeout");
    expect(fetchImpl).toHaveBeenCalledTimes(OVERPASS_ENDPOINTS.length);
  });

  it("um pedido sem resposta a tempo é cortado e passa ao seguinte", async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementationOnce(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => init.signal!.addEventListener("abort", () => reject(init.signal!.reason))),
      )
      .mockResolvedValueOnce(ok([named(2)]));
    const elements = await runOverpassQuery("q", { fetchImpl, requestTimeoutMs: 20, sleep: noSleep });
    expect(elements).toHaveLength(1);
  });

  it("uma consulta recusada (400) não tenta outros servidores", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("mau", { status: 400 }));
    const error = await runOverpassQuery("q", { fetchImpl, sleep: noSleep }).catch((e) => e);
    expect(error.code).toBe("rejected");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("cancelada por quem procura, para logo", async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn().mockImplementation(async () => {
      controller.abort();
      return busy();
    });
    await expect(runOverpassQuery("q", { fetchImpl, signal: controller.signal, sleep: noSleep })).rejects.toBeDefined();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe("busca em partes", () => {
  it("faz as partes por ordem, com pausa, tira as repetidas e só guarda elementos válidos", async () => {
    const progress: OverpassProgress[] = [];
    const sleep = vi.fn(async () => {});
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(ok([named(1), named(2), { type: "node", id: 9, tags: {} }]))
      .mockResolvedValueOnce(ok([named(2), named(3)]));
    const result = await searchOverpass(["a", "b"], { fetchImpl, sleep, onProgress: (p) => progress.push(p) });
    expect(result.failure).toBeUndefined();
    expect(result.elements.map((e) => e.id)).toEqual([1, 2, 3]);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(progress.filter((p) => p.type === "part")).toEqual([
      { type: "part", part: 1, parts: 2 },
      { type: "part", part: 2, parts: 2 },
    ]);
  });

  it("para quando já tem empresas que cheguem", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok([named(1), named(2)]));
    const result = await searchOverpass(["a", "b", "c"], { fetchImpl, sleep: noSleep, limit: 2 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.elements).toHaveLength(2);
  });

  it("se uma parte falhar, fica com o que já chegou e diz que está incompleto", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(ok([named(1)]))
      .mockImplementation(async () => busy());
    const result = await searchOverpass(["a", "b"], { fetchImpl, sleep: noSleep });
    expect(result.elements.map((e) => e.id)).toEqual([1]);
    expect(result.failure).toBe("busy");
  });

  it("sem nada a tempo, devolve a falha de tempo", async () => {
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) =>
          init.signal!.addEventListener("abort", () => reject(init.signal!.reason)),
        ),
    );
    const result = await searchOverpass(["a"], { fetchImpl, sleep: noSleep, totalMs: 20 });
    expect(result).toEqual({ elements: [], failure: "timeout" });
  });
});
