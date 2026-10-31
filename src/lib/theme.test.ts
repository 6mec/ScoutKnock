import { describe, expect, it } from "vitest";
import { GLOBE_COLORS } from "./theme";
import { THEME_SCRIPT } from "./theme-script";

describe("tema", () => {
  it("o script só tira o escuro a quem escolheu o claro", () => {
    expect(THEME_SCRIPT).toContain('==="light"');
    expect(THEME_SCRIPT).toContain('classList.remove("dark")');
  });

  it("o script não falha sem armazenamento", () => {
    expect(THEME_SCRIPT.startsWith("try{")).toBe(true);
  });

  it("o globo tem cores para os dois temas", () => {
    expect(GLOBE_COLORS.dark.dark).toBe(1);
    expect(GLOBE_COLORS.light.dark).toBe(0);
  });
});
