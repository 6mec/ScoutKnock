import { parseSiteUrl } from "@/lib/site";
import "server-only";
import { reportError } from "@/lib/events/log";
import { canPromiseEmail, sendEmail } from "@/lib/email/send";
import { buildConfirmationEmail } from "./confirmation-email";

// Sem tudo isto o formulário fica fechado: não guarda emails nem promete envios.
export function getWaitlistEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.WAITLIST_EMAIL_FROM;
  const tokenSecret = process.env.WAITLIST_TOKEN_SECRET;
  const siteUrl = parseSiteUrl(process.env.SITE_URL);

  if (!apiKey || !from || !tokenSecret || !siteUrl || !canPromiseEmail()) {
    return null;
  }

  return { from, tokenSecret, siteUrl };
}

type EmailConfig = NonNullable<ReturnType<typeof getWaitlistEmailConfig>>;

export async function sendConfirmationEmail(
  config: EmailConfig,
  id: string,
  email: string,
) {
  const { message, devConfirmPath } = buildConfirmationEmail(config, id, email);
  const { ok, status } = await sendEmail(message);

  if (!ok) await reportError("waitlist email", status);

  return { ok, devConfirmPath: ok ? devConfirmPath : null };
}
