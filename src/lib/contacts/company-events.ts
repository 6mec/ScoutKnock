import type { Opportunity } from "@/lib/radar/types";

export type ContactCompany =
  | {
      status: "ok";
      isSample: boolean;
      // Dados escritos pelo freelancer, sem o Google.
      isManual: boolean;
      name: string;
      address: string;
      phone: string | null;
      website: string | null;
      reviewCount: number | null;
      hasOpeningHours: boolean;
      opportunity: Opportunity;
    }
  | { status: "limit" | "unavailable" };

// Os dados chegam primeiro; a verificação do site nunca os atrasa.
export type ContactCompanyEvent =
  | { type: "company"; company: ContactCompany }
  | { type: "site_start" }
  | { type: "site_done"; status: "checked"; opportunity: Opportunity }
  | { type: "site_done"; status: "failed" };
