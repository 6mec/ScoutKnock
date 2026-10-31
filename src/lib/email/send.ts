type Env = Record<string, string | undefined>;

// Endereços de teste do Resend: não chegam a ninguém e não precisam de domínio.
export const TEST_RECIPIENT = "delivered@resend.dev";
export const TEST_SENDER = "onboarding@resend.dev";

export type EmailMessage = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  headers?: Record<string, string>;
};

// Só este valor exato liga o envio real: qualquer outro fica em modo de teste.
export function isRealSending(env: Env = process.env) {
  return env.EMAIL_REAL_SENDING === "true";
}

// Sem envio real, a produção não pode prometer um email que não chega a ninguém.
export function canPromiseEmail(env: Env = process.env) {
  return env.NODE_ENV !== "production" || isRealSending(env);
}

// O único caso em que um link de email pode aparecer fora do email.
export function canExposeEmailLinks(env: Env = process.env) {
  return env.NODE_ENV === "development" && !isRealSending(env);
}

export function resolveDelivery(message: EmailMessage, env: Env = process.env) {
  return isRealSending(env)
    ? message
    : { ...message, from: TEST_SENDER, to: TEST_RECIPIENT };
}

// A única saída de emails da aplicação. Devolve o código HTTP, nunca o conteúdo.
export async function sendEmail(
  message: EmailMessage,
  { env = process.env, fetcher = fetch }: { env?: Env; fetcher?: typeof fetch } = {},
): Promise<{ ok: boolean; status?: number }> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return { ok: false };

  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(resolveDelivery(message, env)),
  });

  return { ok: response.ok, status: response.status };
}
