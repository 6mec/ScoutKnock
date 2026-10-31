import { describe, expect, it } from "vitest";
import { hasAuthCookie } from "./session-cookie";

describe("hasAuthCookie", () => {
  it("reconhece o cookie da sessão, inteiro ou em partes", () => {
    expect(hasAuthCookie([{ name: "sb-abc-auth-token" }])).toBe(true);
    expect(hasAuthCookie([{ name: "sb-abc-auth-token.0" }])).toBe(true);
  });

  it("sem esse cookie, não há nada a validar", () => {
    expect(hasAuthCookie([])).toBe(false);
    expect(hasAuthCookie([{ name: "scoutknock-theme" }])).toBe(false);
    expect(hasAuthCookie([{ name: "sb-abc-auth-token-code-verifier" }])).toBe(false);
  });
});
