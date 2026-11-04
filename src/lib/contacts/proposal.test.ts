import { describe, expect, it } from "vitest";
import { DEFAULT_VALIDITY_DAYS, proposalLines, validityDays, validUntil } from "./proposal";

describe("proposalLines", () => {
  it("soma só as linhas com descrição e valor", () => {
    const { lines, total, invalid } = proposalLines([
      { description: "Site", price: "1.200,50" },
      { description: "Logótipo", price: "150" },
      { description: "", price: "99" },
      { description: "Sem valor", price: "" },
    ]);
    expect(lines).toEqual([
      { description: "Site", price: 1200.5 },
      { description: "Logótipo", price: 150 },
    ]);
    expect(total).toBe(1350.5);
    expect(invalid.size).toBe(0);
  });

  it("assinala valores inválidos e não os soma", () => {
    const { total, invalid } = proposalLines([
      { description: "Site", price: "abc" },
      { description: "Logo", price: "10" },
    ]);
    expect(total).toBe(10);
    expect([...invalid]).toEqual([0]);
  });
});

describe("validade", () => {
  it("aceita de 1 a 365 dias e cai nos 15 por omissão", () => {
    expect(validityDays("30")).toBe(30);
    expect(validityDays("0")).toBe(DEFAULT_VALIDITY_DAYS);
    expect(validityDays("abc")).toBe(DEFAULT_VALIDITY_DAYS);
    expect(validityDays("400")).toBe(DEFAULT_VALIDITY_DAYS);
  });

  it("soma os dias à data de hoje", () => {
    const now = new Date("2026-11-04T10:00:00Z").getTime();
    expect(validUntil(now, 15).toISOString().slice(0, 10)).toBe("2026-11-19");
  });
});
