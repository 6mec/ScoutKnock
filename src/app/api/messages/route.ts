import { reportError } from "@/lib/events/log";
import { recordMessageCost, reserveMessage } from "@/lib/messages/limit";
import { getMessageProvider } from "@/lib/messages/provider";
import {
  parseMessageRequest,
  type MessageEvent,
  type MessageRequest,
} from "@/lib/messages/rules";
import { getCompanyProvider } from "@/lib/radar/provider";
import { scoreCompany } from "@/lib/radar/score";
import { SERVICE_IDS, type ReasonCode } from "@/lib/radar/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Os dados da empresa vêm sempre do servidor, nunca do browser.
async function findCompany(supabase: Supabase, { source }: MessageRequest) {
  if (source.kind === "company") {
    const company = await getCompanyProvider()?.findById(source.id);
    if (!company) return null;

    return {
      companyName: company.name,
      niche: company.niche,
      locality: company.locality,
      reasons: scoreCompany(company, SERVICE_IDS[0]).reasons.map(
        (reason) => reason.code,
      ),
    };
  }

  const { data } = await supabase
    .from("contacts")
    .select("company_name, niche, locality, website")
    .eq("id", source.id)
    .maybeSingle();
  if (!data) return null;

  return {
    companyName: data.company_name as string,
    niche: data.niche as string,
    locality: data.locality as string,
    // O contacto guarda a nota, não os motivos: fica só o que se sabe ao certo.
    reasons: data.website ? [] : (["noWebsite"] as ReasonCode[]),
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response(null, { status: 401 });

  const body = parseMessageRequest(await request.json().catch(() => null));
  if (!body) return new Response(null, { status: 400 });

  const company = await findCompany(supabase, body);
  if (!company) return new Response(null, { status: 404 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const provider = getMessageProvider();

  // O modo simulado não custa nada, por isso não conta para o travão.
  if (!provider.isSample) {
    const reservation = await reserveMessage(createAdminClient(), user.id);
    if (reservation === "limit") return new Response(null, { status: 429 });
    if (reservation === "error") {
      await reportError("mensagens travão", "sem registo", user.id);
      return new Response(null, { status: 503 });
    }
  }

  const pieces = provider.write(
    {
      ...company,
      senderName: (profile?.display_name as string | null) ?? null,
      tone: body.tone,
    },
    {
      signal: request.signal,
      onUsage: async (usage) => {
        const code = await recordMessageCost(
          createAdminClient(),
          user.id,
          usage,
        );
        if (code) await reportError("mensagens custo", code, user.id);
      },
    },
  )[Symbol.asyncIterator]();

  const encoder = new TextEncoder();
  const encode = (event: MessageEvent) =>
    encoder.encode(`${JSON.stringify(event)}\n`);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encode({ type: "start", isSample: provider.isSample }));
    },
    async pull(controller) {
      try {
        const { done, value } = await pieces.next();
        if (done) {
          controller.enqueue(encode({ type: "done" }));
          controller.close();
          return;
        }
        controller.enqueue(encode({ type: "text", text: value }));
      } catch (error) {
        if (request.signal.aborted) {
          controller.close();
          return;
        }
        const status = (error as { status?: number }).status;
        await reportError("mensagens", status ?? "sem código", user.id);
        controller.enqueue(encode({ type: "error", code: "provider" }));
        controller.close();
      }
    },
    async cancel() {
      await pieces.return?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}
