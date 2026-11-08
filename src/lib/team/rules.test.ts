import { describe, expect, it } from "vitest";
import { isTeamRole, parseInviteEmail } from "./rules";

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
});
