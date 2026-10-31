import { describe, expect, it } from "vitest";
import { ptPT } from "./pt-PT";

const { legal } = ptPT;
const privacy = legal.privacy.paragraphs;

describe("política de privacidade provisória", () => {
  it("continua marcada como provisória", () => {
    expect(legal.reviewNotice).toContain("provisório");
  });

  it("não tem marcadores por preencher", () => {
    expect(privacy.join(" ")).not.toMatch(/\[|\]|CONFIRMAR|PRAZO/);
  });

  it("diz que não guarda os dados do Google", () => {
    expect(privacy.join(" ")).toContain(
      "Não guardamos esses dados: guardamos só o identificador da empresa e o que tu escreves.",
    );
  });

  it("a frase da Anthropic diz só o que lhe é enviado, e quando", () => {
    const sentence = privacy.filter((text) => text.includes("Anthropic"));
    expect(sentence).toEqual([
      "Anthropic, quando estiver ligado: recebe o nome da empresa, o nicho e os motivos, para escrever a mensagem.",
    ]);
  });

  it("os serviços ainda desligados estão assinalados", () => {
    for (const service of ["Stripe", "Google", "Anthropic"]) {
      expect(privacy.some((text) => text.startsWith(`${service}, quando estiver ligado:`))).toBe(true);
    }
  });
});
