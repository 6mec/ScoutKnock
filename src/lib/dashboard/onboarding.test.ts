import { describe, expect, it } from "vitest";
import { ONBOARDING_STEPS, onboardingProgress } from "./onboarding";

const none = { contacts: [], hasTemplate: false, requestsMade: 0, projectsMade: 0, portfolioPublished: false };

describe("onboardingProgress", () => {
  it("conta novo começa em zero", () => {
    expect(onboardingProgress(none)).toMatchObject({ count: 0, total: 6, complete: false });
  });

  it("já não pede site demo nem valor de proposta", () => {
    expect(ONBOARDING_STEPS).not.toContain("demo");
    expect(ONBOARDING_STEPS).not.toContain("proposal");
    expect(ONBOARDING_STEPS).toContain("project");
  });

  it("cada passo vem do que já está feito", () => {
    const { done, count } = onboardingProgress({
      ...none,
      contacts: [
        { status: "to_contact", last_contacted_at: null },
        { status: "proposal", last_contacted_at: "2026-11-01T10:00:00Z" },
      ],
      hasTemplate: true,
      requestsMade: 1,
    });
    expect(done).toEqual({
      addCompany: true,
      contactCompany: true,
      message: true,
      request: true,
      project: false,
      portfolio: false,
    });
    expect(count).toBe(4);
  });

  it("guardar sem contactar não conta como contactado", () => {
    const { done } = onboardingProgress({
      ...none,
      contacts: [{ status: "to_contact", last_contacted_at: null }],
    });
    expect(done.addCompany).toBe(true);
    expect(done.contactCompany).toBe(false);
  });

  it("tudo feito esconde a lista", () => {
    expect(
      onboardingProgress({
        contacts: [{ status: "won", last_contacted_at: "2026-11-01T10:00:00Z" }],
        hasTemplate: true,
        requestsMade: 1,
        projectsMade: 1,
        portfolioPublished: true,
      }).complete,
    ).toBe(true);
  });
});
