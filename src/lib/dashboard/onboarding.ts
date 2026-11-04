import type { Contact } from "@/lib/contacts/rules";

// Primeiros passos: calculados a partir do que a pessoa já fez, sem nada guardado à parte.
export const ONBOARDING_STEPS = [
  "addCompany",
  "contactCompany",
  "message",
  "demo",
  "proposal",
  "portfolio",
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const ONBOARDING_LINKS: Record<OnboardingStep, string> = {
  addCompany: "/painel/radar",
  contactCompany: "/painel/contactos",
  message: "/painel/contactos",
  demo: "/painel/radar",
  proposal: "/painel/contactos",
  portfolio: "/painel/portfolio",
};

export function onboardingProgress({
  contacts,
  hasTemplate,
  demosMade,
  portfolioPublished,
}: {
  contacts: Pick<Contact, "status" | "deal_value" | "last_contacted_at">[];
  hasTemplate: boolean;
  demosMade: number;
  portfolioPublished: boolean;
}) {
  const done: Record<OnboardingStep, boolean> = {
    addCompany: contacts.length > 0,
    contactCompany: contacts.some(
      (contact) => contact.status !== "to_contact" || contact.last_contacted_at !== null,
    ),
    message: hasTemplate,
    demo: demosMade > 0,
    proposal: contacts.some((contact) => contact.deal_value !== null),
    portfolio: portfolioPublished,
  };
  const count = ONBOARDING_STEPS.filter((step) => done[step]).length;
  const total = ONBOARDING_STEPS.length;
  return { done, count, total, percent: Math.round((count / total) * 100), complete: count === total };
}
