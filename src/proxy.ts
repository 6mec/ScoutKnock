import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { subdomainRewritePath } from "@/lib/demos/official-rules";
import { signupsOpen } from "@/lib/personal-mode";
import { getSupabaseConfig } from "@/lib/supabase/config";

const PROTECTED_PATHS = ["/painel", "/nova-palavra-passe"];
const GUEST_PATHS = ["/entrar", "/registar", "/recuperar"];

export async function proxy(request: NextRequest) {
  // A raiz só passa por aqui para o modelo de subdomínio, desligado sem domínio.
  if (request.nextUrl.pathname === "/") {
    const rewritePath = subdomainRewritePath(
      request.headers.get("host"),
      "/",
      process.env.OFFICIAL_SITES_BASE_DOMAIN,
    );
    if (rewritePath) return NextResponse.rewrite(new URL(rewritePath, request.url));
    // Modo pessoal: sem página de venda, a raiz leva à entrada (ou ao painel).
    return signupsOpen()
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/entrar", request.url));
  }

  if (request.nextUrl.pathname === "/registar" && !signupsOpen()) {
    return NextResponse.redirect(new URL("/entrar", request.url));
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

  const { pathname } = request.nextUrl;
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

export const config = {
  matcher: [
    "/",
    "/painel/:path*",
    "/nova-palavra-passe",
    "/entrar",
    "/registar",
    "/recuperar",
  ],
};
