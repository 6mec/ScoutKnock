// Modo pessoal: a app é só do Daniel. Sem "true", não se criam contas novas e a raiz
// leva à entrada em vez da página de venda. A página de venda fica no código para o
// dia em que os registos abrirem.
// Isto fecha a app; para fechar mesmo os registos, desliga também "Allow new users to
// sign up" no Supabase (Authentication, Sign In / Providers).
export function signupsOpen(env: Record<string, string | undefined> = process.env) {
  return env.SIGNUPS_ENABLED === "true";
}
