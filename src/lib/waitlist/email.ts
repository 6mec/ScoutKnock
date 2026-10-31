import "server-only";
import { ptPT } from "@/i18n/pt-PT";
import { createToken } from "./tokens";

const { email: copy } = ptPT.waitlist;

// Sem tudo isto o formulário fica fechado: não guarda emails nem promete envios.
export function getWaitlistEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.WAITLIST_EMAIL_FROM;
  const tokenSecret = process.env.WAITLIST_TOKEN_SECRET;
  const siteUrl = process.env.SITE_URL;

  if (!apiKey || !from || !tokenSecret || !siteUrl) return null;

  return { apiKey, from, tokenSecret, siteUrl };
}

type EmailConfig = NonNullable<ReturnType<typeof getWaitlistEmailConfig>>;

export async function sendConfirmationEmail(
  config: EmailConfig,
  id: string,
  email: string,
) {
  const link = (path: string, purpose: "confirm" | "unsubscribe") => {
    const url = new URL(path, config.siteUrl);
    url.searchParams.set("id", id);
    url.searchParams.set("token", createToken(config.tokenSecret, purpose, id));
    return url.toString();
  };
  const confirmUrl = link("/lista/confirmar", "confirm");
  const unsubscribeUrl = link("/lista/sair", "unsubscribe");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: email,
      subject: copy.subject,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
      text: [
        copy.intro,
        confirmUrl,
        copy.ignore,
        `${copy.unsubscribe} ${unsubscribeUrl}`,
      ].join("\n\n"),
      html: [
        `<p>${copy.intro}</p>`,
        `<p><a href="${confirmUrl}">${copy.confirmLink}</a></p>`,
        `<p>${copy.ignore}</p>`,
        `<p><a href="${unsubscribeUrl}">${copy.unsubscribe}</a></p>`,
      ].join(""),
    }),
  });

  if (!response.ok) {
    console.error(`waitlist email: resposta ${response.status}`);
  }

  return response.ok;
}
