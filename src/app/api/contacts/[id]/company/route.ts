import type {
  ContactCompany,
  ContactCompanyEvent,
} from "@/lib/contacts/company-events";
import { lookupContactCompany } from "@/lib/contacts/company-server";
import { scoreCompany } from "@/lib/radar/score";
import { getSiteChecker } from "@/lib/radar/site-checker";
import { thirdPartyKind } from "@/lib/radar/site-rules";
import { SERVICE_IDS } from "@/lib/radar/types";
import { createClient } from "@/lib/supabase/server";

// POST porque abrir um contacto gasta uma chamada paga. O endereço do site nunca vem
// do browser: o servidor obtém-no a partir do contacto do próprio utilizador.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response(null, { status: 401 });

  const { id } = await params;
  const service = SERVICE_IDS[0];
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ContactCompanyEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      const finish = (company: ContactCompany) => {
        send({ type: "company", company });
        controller.close();
      };

      try {
        const lookup = await lookupContactCompany(supabase, id, user.id);
        if (lookup.status !== "ok") return finish(lookup);

        const { company, isSample } = lookup;
        const isManual = lookup.isManual ?? false;
        send({
          type: "company",
          company: {
            status: "ok",
            isSample,
            isManual,
            name: company.name,
            address: company.address,
            phone: company.phone ?? null,
            website: company.website,
            reviewCount: company.reviewCount,
            hasOpeningHours: company.hasOpeningHours,
            opportunity: scoreCompany(company, service),
          },
        });

        const checker = getSiteChecker({ userId: user.id, kind: "contact" });
        if (
          checker &&
          !isSample &&
          company.website &&
          !thirdPartyKind(company.website)
        ) {
          send({ type: "site_start" });
          const allowed = await checker.reserve(1);
          const result =
            allowed > 0
              ? await checker.check(company.website, request.signal)
              : ({ status: "failed" } as const);

          send(
            result.status === "checked"
              ? {
                  type: "site_done",
                  status: "checked",
                  opportunity: scoreCompany({ ...company, site: result.site }, service),
                }
              : { type: "site_done", status: "failed" },
          );
        }
        controller.close();
      } catch {
        // O browser pode já ter fechado o contacto.
        try {
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}
