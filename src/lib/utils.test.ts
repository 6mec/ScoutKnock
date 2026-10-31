import { describe, expect, it } from "vitest";
import { entranceReduced, staggerDelay } from "./motion";
import { isUiPreviewEnabled } from "./ui-preview";
import { cn } from "./utils";

describe("cn", () => {
  it("mantém o tamanho e a cor do texto, que são grupos diferentes", () => {
    expect(cn("text-16", "text-muted")).toBe("text-16 text-muted");
  });

  it("o último token do mesmo grupo ganha", () => {
    expect(cn("text-16", "text-14")).toBe("text-14");
    expect(cn("rounded-md", "rounded-lg")).toBe("rounded-lg");
    expect(cn("shadow-float", "shadow-halo")).toBe("shadow-halo");
  });

  it("ignora valores falsos", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });
});

describe("staggerDelay", () => {
  it("usa 60 ms entre itens", () => {
    expect(staggerDelay(2)).toBeCloseTo(0.12);
  });

  it("para ao fim de 8 itens", () => {
    expect(staggerDelay(50)).toBeCloseTo(staggerDelay(7));
  });
});

describe("entranceReduced", () => {
  it("nunca deixa deslize nem desfoque", () => {
    for (const state of [entranceReduced.hidden, entranceReduced.visible]) {
      expect(state.y).toBe(0);
      expect(state.filter).toBe("blur(0px)");
    }
  });
});

describe("isUiPreviewEnabled", () => {
  it("só está ativa em desenvolvimento", () => {
    expect(isUiPreviewEnabled("development")).toBe(true);
    expect(isUiPreviewEnabled("production")).toBe(false);
    expect(isUiPreviewEnabled("test")).toBe(false);
    expect(isUiPreviewEnabled(undefined)).toBe(false);
  });
});
