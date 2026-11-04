import { describe, expect, it, vi } from "vitest";
import { CLAUDE_MODEL } from "@/lib/messages/claude-provider";
import { IDENTITY_KEYS } from "./identities";
import { MAX_HEADLINE, MAX_HIGHLIGHTS, MAX_SERVICES, parseDemoContent } from "./rules";
import {
  buildSiteRequest,
  createClaudeSiteWriter,
  getSiteWriter,
  parseSiteCopy,
  sampleSiteCopy,
  SiteWriterError,
  type SiteClaudeClient,
} from "./site-writer";

const input = {
  companyName: "Barbearia do Zé",
  niche: "Barbearias",
  locality: "Porto",
  nicheStyle: "barbearia" as const,
};

const good = {
  headline: "Corte à moda antiga no Porto",
  subheadline: "Marque e venha.",
  intro: "A Barbearia do Zé corta cabelo e barba.",
  ctaLabel: "Marcar",
  about: "Uma barbearia de bairro.",
  services: [
    { title: "Corte", description: "Clássico." },
    { title: "Barba", description: "À navalha." },
  ],
  highlights: [{ title: "Marcação", description: "Por telefone." }],
};

function fakeClient(reply: { text?: string; stop_reason?: string }) {
  const create = vi.fn(async () => ({
    content: reply.text === undefined ? [] : [{ type: "text", text: reply.text, citations: null }],
    stop_reason: reply.stop_reason ?? "end_turn",
    usage: { input_tokens: 300, output_tokens: 400 },
  }));
  return { client: { messages: { create } } as unknown as SiteClaudeClient, create };
}

describe("modelo do nicho (sem chave)", () => {
  it("sem chave usa o modelo do nicho, sem custos", () => {
    expect(getSiteWriter(undefined).isSample).toBe(true);
    expect(getSiteWriter("chave").isSample).toBe(false);
  });

  it.each(IDENTITY_KEYS)("%s dá textos que se podem guardar", (nicheStyle) => {
    const copy = sampleSiteCopy({ ...input, nicheStyle });
    expect(copy.headline).toContain("Porto");
    expect(copy.headline.length).toBeLessThanOrEqual(MAX_HEADLINE);
    // Os textos do modelo passam nas mesmas regras que o editor usa para guardar.
    const content = parseDemoContent({
      companyName: input.companyName,
      niche: input.niche,
      locality: input.locality,
      address: "Rua A, 1",
      phone: null,
      template: "classic",
      accentColor: "#0F766E",
      nicheStyle,
      ...copy,
    });
    expect(content).not.toBeNull();
  });
});

describe("parseSiteCopy", () => {
  it("corta textos longos sem partir palavras e limita as listas", () => {
    const copy = parseSiteCopy({
      ...good,
      headline: "palavra ".repeat(40),
      services: Array.from({ length: 9 }, (_, i) => ({ title: `S${i}`, description: "" })),
      highlights: Array.from({ length: 5 }, (_, i) => ({ title: `H${i}`, description: "" })),
    });
    expect(copy?.headline.length).toBeLessThanOrEqual(MAX_HEADLINE);
    expect(copy?.headline.endsWith("palavra")).toBe(true);
    expect(copy?.services).toHaveLength(MAX_SERVICES);
    expect(copy?.highlights).toHaveLength(MAX_HIGHLIGHTS);
  });

  it("recusa respostas sem título, sem texto ou sem serviços", () => {
    expect(parseSiteCopy({ ...good, headline: "" })).toBeNull();
    expect(parseSiteCopy({ ...good, services: [] })).toBeNull();
    expect(parseSiteCopy("texto")).toBeNull();
  });
});

describe("pedido ao Claude", () => {
  it("usa o modelo das mensagens, um esquema JSON e só o nome, o nicho e a localidade", () => {
    const request = buildSiteRequest(input);
    expect(request.model).toBe(CLAUDE_MODEL);
    expect(request.output_config.format.type).toBe("json_schema");
    expect(JSON.parse(request.messages[0].content)).toEqual({
      empresa: "Barbearia do Zé",
      nicho: "Barbearias",
      localidade: "Porto",
      estilo: "Barbearia",
    });
    expect(request.system).toContain("Não inventes preços");
    expect(request.system).toContain("Tom deste nicho");
  });

  it("lê a resposta e conta os tokens", async () => {
    const { client } = fakeClient({ text: JSON.stringify(good) });
    const usage = vi.fn();
    const copy = await createClaudeSiteWriter("chave", client, usage).write(input);
    expect(copy.headline).toBe(good.headline);
    expect(usage).toHaveBeenCalledWith({ inputTokens: 300, outputTokens: 400 });
  });

  it.each([
    [{ text: JSON.stringify(good), stop_reason: "refusal" }],
    [{ text: JSON.stringify(good), stop_reason: "max_tokens" }],
    [{ text: "não é json" }],
    [{ text: JSON.stringify({ ...good, services: [] }) }],
    [{}],
  ])("falha com clareza em %j", async (reply) => {
    const { client } = fakeClient(reply);
    await expect(createClaudeSiteWriter("chave", client).write(input)).rejects.toBeInstanceOf(
      SiteWriterError,
    );
  });
});
