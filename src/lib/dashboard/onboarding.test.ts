import { describe, expect, it } from "vitest";
import { onboardingProgress } from "./onboarding";

const none = { contacts: [], hasTemplate: false, demosMade: 0, portfolioPublished: false };

describe("onboardingProgress", () => {
  it("conta novo começa em zero", () => {
    expect(onboardingProgress(none)).toMatchObject({ count: 0, total: 6, complete: false });
  });

  it("cada passo vem do que já está feito", () => {
    const { done, count } = onboardingProgress({
      ...none,
      contacts: [
        { status: "to_contact", deal_value: null, last_contacted_at: null },
        { status: "proposal", deal_value: 300, last_contacted_at: "2026-11-01T10:00:00Z" },
      ],
      hasTemplate: true,
    });
    expect(done).toEqual({
      addCompany: true,
      contactCompany: true,
      message: true,
      demo: false,
      proposal: true,
      portfolio: false,
    });
    expect(count).toBe(4);
  });

  it("guardar sem contactar não conta como contactado", () => {
    const { done } = onboardingProgress({
      ...none,
      contacts: [{ status: "to_contact", deal_value: null, last_contacted_at: null }],
    });
    expect(done.addCompany).toBe(true);
    expect(done.contactCompany).toBe(false);
  });

  it("tudo feito esconde a lista", () => {
    expect(
      onboardingProgress({
        contacts: [{ status: "won", deal_value: 500, last_contacted_at: "2026-11-01T10:00:00Z" }],
        hasTemplate: true,
        demosMade: 1,
        portfolioPublished: true,
      }).complete,
    ).toBe(true);
  });
});
