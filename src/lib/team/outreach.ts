import "server-only";
import { reportError } from "@/lib/events/log";
import { portfolioUrl } from "@/lib/portfolio/rules";
import { homePortfolioSlug, siteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";
import { getAccess } from "./access";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// O que as mensagens precisam: o modelo do WhatsApp e o link do portfólio publicado.
// O dono lê os seus. O Comercial usa o seu modelo (ou o do dono, se não tiver) e o
// portfólio do dono. Como ele não lê o perfil nem o portfólio do dono, o servidor lê só
// estes campos com a chave secreta.
export async function loadOutreach(supabase: Supabase): Promise<{ template: string | null; portfolioUrl: string | null }> {
  const access = await getAccess();
  const own = await supabase.from("profiles").select("whatsapp_template").eq("id", access.userId).maybeSingle();
  const ownTemplate = (own.data?.whatsapp_template as string | null | undefined) ?? null;

  const reader = access.role === "owner" ? supabase : createAdminClient();
  const [portfolio, ownerProfile] = await Promise.all([
    reader.from("portfolios").select("slug, published").eq("user_id", access.workspaceId).maybeSingle(),
    access.role === "owner" || ownTemplate
      ? Promise.resolve(null)
      : reader.from("profiles").select("whatsapp_template").eq("id", access.workspaceId).maybeSingle(),
  ]);
  if (portfolio.error) await reportError("mensagens portfólio", portfolio.error.code, access.userId);

  const slug = portfolio.data?.published ? (portfolio.data.slug as string) : null;
  return {
    template: ownTemplate ?? ((ownerProfile?.data?.whatsapp_template as string | null | undefined) ?? null),
    portfolioUrl: slug ? portfolioUrl(slug, siteUrl(), homePortfolioSlug()) : null,
  };
}
