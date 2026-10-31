import { createClient } from "@/lib/supabase/server";
import { getCompanyProvider } from "@/lib/radar/provider";
import { runSearch } from "@/lib/radar/run-search";
import { parseSearchQuery } from "@/lib/radar/search-events";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response(null, { status: 401 });

  const provider = getCompanyProvider();
  if (!provider) return new Response(null, { status: 503 });

  const query = parseSearchQuery(await request.json().catch(() => null));
  if (!query) return new Response(null, { status: 400 });

  const events = runSearch(provider, query, request.signal);
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await events.next();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
    },
    async cancel() {
      await events.return(undefined);
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}
