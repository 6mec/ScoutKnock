import { ptPT } from "@/i18n/pt-PT";
import { canExposeEmailLinks, type EmailMessage } from "@/lib/email/send";
import { createToken } from "./tokens";

const { email: copy } = ptPT.waitlist;

// O caminho de confirmação só sai daqui em dev com o envio real desligado.
// Em qualquer outro caso é null: nunca chega a respostas, registos ou HTML.
export function buildConfirmationEmail(
  config: { from: string; tokenSecret: string; siteUrl: string },
  id: string,
  email: string,
  env: Record<string, string | undefined> = process.env,
): { message: EmailMessage; devConfirmPath: string | null } {
  const link = (path: string, purpose: "confirm" | "unsubscribe") => {
    const url = new URL(path, config.siteUrl);
    url.searchParams.set("id", id);
    url.searchParams.set("token", createToken(config.tokenSecret, purpose, id));
    return url;
  };
  const confirm = link("/lista/confirmar", "confirm");
  const confirmUrl = confirm.toString();
  const unsubscribeUrl = link("/lista/sair", "unsubscribe").toString();

  return {
    message: {
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
    },
    devConfirmPath: canExposeEmailLinks(env)
      ? `${confirm.pathname}${confirm.search}`
      : null,
  };
}
