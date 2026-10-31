import { describe, expect, it } from "vitest";
import { ptPT } from "@/i18n/pt-PT";
import { isDeleteConfirmed, PLANS } from "./rules";

describe("isDeleteConfirmed", () => {
  it("aceita só o texto exato", () => {
    expect(isDeleteConfirmed("APAGAR")).toBe(true);
  });

  it.each(["apagar", " APAGAR", "APAGAR ", "", null, undefined, 1])(
    "rejeita %j",
    (value) => {
      expect(isDeleteConfirmed(value)).toBe(false);
    },
  );
});

describe("planos", () => {
  it("têm um único recomendado", () => {
    expect(PLANS.filter((plan) => plan.recommended)).toHaveLength(1);
  });

  it("têm todos um nome", () => {
    PLANS.forEach((plan) => expect(ptPT.plans.names[plan.id]).toBeTruthy());
  });

  it("não mostram preços enquanto não estão decididos", () => {
    expect(JSON.stringify(ptPT.plans)).not.toMatch(/€|R\$/);
  });
});
