import { describe, expect, it } from "vitest";
import { canOpen, isTeamRole, parseInviteEmail } from "./rules";

describe("equipa", () => {
  it("só aceita as três funções", () => {
    expect(isTeamRole("admin")).toBe(true);
    expect(isTeamRole("read_only")).toBe(true);
    expect(isTeamRole("owner")).toBe(false);
  });

  it("o email do convite fica em minúsculas e tem de ser válido", () => {
    expect(parseInviteEmail(" Ana@Exemplo.PT ")).toBe("ana@exemplo.pt");
    expect(parseInviteEmail("ana@exemplo")).toBeNull();
    expect(parseInviteEmail(42)).toBeNull();
  });

  it("o Comercial não abre projetos, portfólio, equipa nem planos; o dono abre tudo", () => {
    for (const segment of ["projetos", "portfolio", "equipa", "planos", "ui"]) {
      expect(canOpen("sales", segment)).toBe(false);
      expect(canOpen("owner", segment)).toBe(true);
    }
    for (const segment of [null, "radar", "contactos", "demos", "pedidos", "conta"]) expect(canOpen("sales", segment)).toBe(true);
  });
});
