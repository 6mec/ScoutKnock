import { describe, expect, it } from "vitest";
import { GLOBE_COLORS } from "./theme";
import { THEME_SCRIPT } from "./theme-script";

describe("tema", () => {
  it("o claro é o tema por omissão: o script só põe o escuro a quem o escolheu", () => {
    expect(THEME_SCRIPT).toContain('==="dark"');
    expect(THEME_SCRIPT).toContain('classList.add("dark")');
  });

  it("o script não falha sem armazenamento", () => {
    expect(THEME_SCRIPT.startsWith("try{")).toBe(true);
  });

  it("o globo tem cores para os dois temas", () => {
    expect(GLOBE_COLORS.dark.dark).toBe(1);
    expect(GLOBE_COLORS.light.dark).toBe(0);
  });
});
