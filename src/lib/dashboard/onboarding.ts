import type { Contact } from "@/lib/contacts/rules";

// Primeiros passos: calculados a partir do que a pessoa já fez, sem nada guardado à parte.
export const ONBOARDING_STEPS = [
  "addCompany",
  "contactCompany",
  "message",
  "request",
  "project",
  "portfolio",
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const ONBOARDING_LINKS: Record<OnboardingStep, string> = {
  addCompany: "/painel/radar",
  contactCompany: "/painel/contactos",
  message: "/painel/contactos",
  request: "/painel/contactos",
  project: "/painel/projetos",
  portfolio: "/painel/portfolio",
};

export function onboardingProgress({
  contacts,
  hasTemplate,
  requestsMade,
  projectsMade,
  portfolioPublished,
}: {
  contacts: Pick<Contact, "status" | "last_contacted_at">[];
  hasTemplate: boolean;
  requestsMade: number;
  projectsMade: number;
  portfolioPublished: boolean;
}) {
  const done: Record<OnboardingStep, boolean> = {
    addCompany: contacts.length > 0,
    contactCompany: contacts.some(
      (contact) => contact.status !== "to_contact" || contact.last_contacted_at !== null,
    ),
    message: hasTemplate,
    request: requestsMade > 0,
    project: projectsMade > 0,
    portfolio: portfolioPublished,
  };
  const count = ONBOARDING_STEPS.filter((step) => done[step]).length;
  const total = ONBOARDING_STEPS.length;
  return { done, count, total, percent: Math.round((count / total) * 100), complete: count === total };
}
