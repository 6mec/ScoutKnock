import { describe, expect, it } from "vitest";
import {
  confirmDestination,
  isValidEmail,
  isValidPassword,
} from "./validation";

describe("isValidEmail", () => {
  it("aceita um email normal", () => {
    expect(isValidEmail("ana@exemplo.pt")).toBe(true);
  });

  it.each(["", "ana", "ana@exemplo", "a na@exemplo.pt", "@exemplo.pt"])(
    "rejeita %j",
    (email) => {
      expect(isValidEmail(email)).toBe(false);
    },
  );
});

describe("isValidPassword", () => {
  it("rejeita menos de 8 caracteres", () => {
    expect(isValidPassword("1234567")).toBe(false);
  });

  it("aceita 8 caracteres", () => {
    expect(isValidPassword("12345678")).toBe(true);
  });
});

describe("confirmDestination", () => {
  it("envia a confirmação de email para o painel", () => {
    expect(confirmDestination("email")).toBe("/painel");
  });

  it("envia a recuperação para a nova palavra-passe", () => {
    expect(confirmDestination("recovery")).toBe("/nova-palavra-passe");
  });

  it.each([null, "", "signup", "https://exemplo.com"])(
    "rejeita o tipo %j",
    (type) => {
      expect(confirmDestination(type)).toBeNull();
    },
  );
});
