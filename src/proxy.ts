import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { subdomainRewritePath } from "@/lib/demos/official-rules";
import { signupsOpen } from "@/lib/personal-mode";
import { canonicalRedirect, homePortfolioSlug } from "@/lib/site";
import { getSupabaseConfig } from "@/lib/supabase/config";

const PROTECTED_PATHS = ["/painel", "/nova-palavra-passe"];
const GUEST_PATHS = ["/entrar", "/registar", "/recuperar"];

const SESSION_PATHS = [...PROTECTED_PATHS, ...GUEST_PATHS];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Um só endereço: www e o .netlify.app de produção vão para o domínio de SITE_URL.
  // /auth fica de fora: o regresso do email de entrada precisa dos cookies do mesmo endereço.
  if (pathname !== "/auth" && !pathname.startsWith("/auth/")) {
    const target = canonicalRedirect(request.headers.get("host"), `${pathname}${search}`);
    if (target) return NextResponse.redirect(target, 308);
  }

  const home = homePortfolioSlug();

  if (pathname === "/") {
    // Modelo de subdomínio dos sites oficiais, desligado sem domínio.
    const rewritePath = subdomainRewritePath(
      request.headers.get("host"),
      "/",
      process.env.OFFICIAL_SITES_BASE_DOMAIN,
    );
    if (rewritePath) return NextResponse.rewrite(new URL(rewritePath, request.url));
    // A raiz mostra o portfólio de HOME_PORTFOLIO_SLUG, com o endereço "/" no browser.
    if (home) return NextResponse.rewrite(new URL(`/p/${home}${search}`, request.url));
    // Modo pessoal: sem página de venda, a raiz leva à entrada (ou ao painel).
    return signupsOpen()
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/entrar", request.url));
  }

  // O portfólio da raiz tem um só endereço. Temporário: se HOME_PORTFOLIO_SLUG mudar, o
  // browser não fica com um reencaminhamento antigo guardado.
  if (home && (pathname === `/p/${home}` || pathname === `/p/${home}/`)) {
    return NextResponse.redirect(new URL(`/${search}`, request.url), 307);
  }

  if (pathname === "/registar" && !signupsOpen()) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }

  // Planos e packs ficam em pausa com os registos fechados: a página fica no código.
  if ((pathname === "/painel/planos" || pathname.startsWith("/painel/planos/")) && !signupsOpen()) {
    return NextResponse.redirect(new URL("/painel", request.url));
  }

  // Só as páginas que dependem da sessão vão ao Supabase.
  if (!SESSION_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  const { url, publishableKey } = getSupabaseConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // Renova a sessão se for preciso e valida-a junto do Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const matches = (paths: string[]) =>
    paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  let redirectTo: string | null = null;
  if (!user && matches(PROTECTED_PATHS)) redirectTo = "/entrar";
  if (user && matches(GUEST_PATHS)) redirectTo = "/painel";

  if (redirectTo) {
    const redirect = NextResponse.redirect(new URL(redirectTo, request.url));
    // Não perder cookies de uma sessão acabada de renovar ou terminar.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}

// Todas as páginas (para o endereço principal), menos a API, os ficheiros do Next e os
// ficheiros estáticos.
export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml|js|css|woff2?)$).*)",
  ],
};
