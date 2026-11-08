import { describe, expect, it } from "vitest";
import { ptPT } from "@/i18n/pt-PT";
import { DEMO_BUSINESS_NAME, DEMO_SLOTS, builderMessage, demoDays } from "./showcase";

describe("montra do portfólio", () => {
  it("a demonstração mostra os próximos dias, sem o domingo", () => {
    // 2026-11-07 é um sábado: o domingo (08) fica de fora.
    expect(demoDays("2026-11-07", 3)).toEqual(["2026-11-09", "2026-11-10", "2026-11-11"]);
  });

  it("o horário de exemplo vai das 19:30 às 22:00 de 30 em 30 minutos", () => {
    expect(DEMO_SLOTS).toEqual(["19:30", "20:00", "20:30", "21:00", "21:30", "22:00"]);
    expect(DEMO_BUSINESS_NAME.length).toBeGreaterThan(0);
  });

  it("a mensagem do configurador leva o que foi escolhido, sem preços", () => {
    const text = builderMessage(ptPT.portfolio.showcase.builder.message, {
      owner: "Daniel",
      kind: "Site com marcações online",
      features: ["Marcações online", "Galeria de fotos"],
      deadline: "Até 1 mês",
    });
    expect(text).toBe(
      "Olá Daniel! Vi o teu portfólio e quero montar um projeto.\nTipo: Site com marcações online.\nFuncionalidades: Marcações online, Galeria de fotos.\nPrazo: Até 1 mês.\nPodemos falar?",
    );
    expect(text).not.toMatch(/€/);
  });
});
