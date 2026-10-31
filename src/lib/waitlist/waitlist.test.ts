import { describe, expect, it } from "vitest";
import {
  RESEND_COOLDOWN_MS,
  canResendEmail,
  isValidWaitlistEmail,
  normalizeEmail,
  parseService,
} from "./rules";
import { createToken, verifyToken } from "./tokens";

describe("email", () => {
  it("normaliza espaços e maiúsculas", () => {
    expect(normalizeEmail("  Ana@Exemplo.PT ")).toBe("ana@exemplo.pt");
  });

  it("rejeita emails inválidos ou demasiado longos", () => {
    expect(isValidWaitlistEmail("ana")).toBe(false);
    expect(isValidWaitlistEmail(`${"a".repeat(250)}@a.pt`)).toBe(false);
    expect(isValidWaitlistEmail("ana@exemplo.pt")).toBe(true);
  });
});

describe("parseService", () => {
  it("aceita uma opção conhecida", () => {
    expect(parseService("design")).toBe("design");
  });

  it.each(["", "outra coisa", "SITES"])("ignora %j", (service) => {
    expect(parseService(service)).toBeNull();
  });
});

describe("canResendEmail", () => {
  const sentAt = "2026-11-01T10:00:00.000Z";
  const sentAtMs = new Date(sentAt).getTime();

  it("não reenvia dentro do intervalo", () => {
    expect(canResendEmail(sentAt, sentAtMs + RESEND_COOLDOWN_MS - 1)).toBe(false);
  });

  it("reenvia depois do intervalo", () => {
    expect(canResendEmail(sentAt, sentAtMs + RESEND_COOLDOWN_MS)).toBe(true);
  });
});

describe("tokens", () => {
  const secret = "segredo-de-teste";
  const id = "11111111-1111-1111-1111-111111111111";

  it("aceita o código certo", () => {
    const token = createToken(secret, "confirm", id);
    expect(verifyToken(secret, "confirm", id, token)).toBe(true);
  });

  it("não aceita o código de outro propósito", () => {
    const token = createToken(secret, "confirm", id);
    expect(verifyToken(secret, "unsubscribe", id, token)).toBe(false);
  });

  it("não aceita o código de outra pessoa", () => {
    const token = createToken(secret, "confirm", id);
    const other = "22222222-2222-2222-2222-222222222222";
    expect(verifyToken(secret, "confirm", other, token)).toBe(false);
  });

  it("não aceita outro segredo nem códigos mal formados", () => {
    const token = createToken(secret, "confirm", id);
    expect(verifyToken("outro", "confirm", id, token)).toBe(false);
    expect(verifyToken(secret, "confirm", id, "abc")).toBe(false);
    expect(verifyToken(secret, "confirm", id, "")).toBe(false);
  });
});
