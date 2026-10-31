// O Supabase pode dividir o cookie da sessão em partes: nome.0, nome.1...
const AUTH_COOKIE = /^sb-.+-auth-token(\.\d+)?$/;

export function hasAuthCookie(cookies: { name: string }[]) {
  return cookies.some(({ name }) => AUTH_COOKIE.test(name));
}
