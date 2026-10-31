import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { buildConfirmationEmail } from "@/lib/waitlist/confirmation-email";
import {
  TEST_RECIPIENT,
  TEST_SENDER,
  canExposeEmailLinks,
  canPromiseEmail,
  isRealSending,
  sendEmail,
  type EmailMessage,
} from "./send";

const message: EmailMessage = {
  from: "ScoutKnock <ola@scoutknock.test>",
  to: "pessoa.real@gmail.com",
  subject: "Assunto",
  text: "Texto",
  html: "<p>Texto</p>",
};

function fakeFetch(status = 200) {
  return vi.fn(async () => new Response("{}", { status }));
}

function sentBody(fetcher: ReturnType<typeof fakeFetch>) {
  const [, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
  return JSON.parse(init.body as string);
}

describe("destinatário dos emails", () => {
  it.each([undefined, "", "false", "TRUE", "1", "sim", " true"])(
    "com o interruptor a %j, troca sempre o destinatário e o remetente",
    async (value) => {
      const fetcher = fakeFetch();
      const env = { RESEND_API_KEY: "re_x", EMAIL_REAL_SENDING: value };
      const result = await sendEmail(message, {
        env,
        fetcher: fetcher as unknown as typeof fetch,
      });

      expect(result.ok).toBe(true);
      expect(sentBody(fetcher)).toMatchObject({
        to: TEST_RECIPIENT,
        from: TEST_SENDER,
        subject: "Assunto",
      });
      expect(JSON.stringify(fetcher.mock.calls)).not.toContain("pessoa.real");
    },
  );

  it("só o valor exato envia a sério", async () => {
    const fetcher = fakeFetch();
    await sendEmail(message, {
      env: { RESEND_API_KEY: "re_x", EMAIL_REAL_SENDING: "true" },
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(sentBody(fetcher).to).toBe("pessoa.real@gmail.com");
    expect(isRealSending({ EMAIL_REAL_SENDING: "true" })).toBe(true);
  });

  it("sem chave não há pedido nenhum", async () => {
    const fetcher = fakeFetch();
    expect(
      await sendEmail(message, {
        env: {},
        fetcher: fetcher as unknown as typeof fetch,
      }),
    ).toEqual({ ok: false });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("uma recusa do Resend devolve só o código", async () => {
    expect(
      await sendEmail(message, {
        env: { RESEND_API_KEY: "re_x" },
        fetcher: fakeFetch(422) as unknown as typeof fetch,
      }),
    ).toEqual({ ok: false, status: 422 });
  });

  it("nada fora deste ficheiro fala com o Resend", () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.tsx?$/.test(name) && !name.includes(".test.")) files.push(path);
      }
    };
    walk("src");

    const callers = files.filter((file) =>
      readFileSync(file, "utf8").includes("api.resend.com"),
    );
    expect(callers.map((file) => file.replaceAll("\\", "/"))).toEqual([
      "src/lib/email/send.ts",
    ]);
  });
});

describe("lista de espera sem envio real", () => {
  it("em produção não promete um email que não chega a ninguém", () => {
    expect(canPromiseEmail({ NODE_ENV: "production" })).toBe(false);
    expect(
      canPromiseEmail({ NODE_ENV: "production", EMAIL_REAL_SENDING: "true" }),
    ).toBe(true);
    expect(canPromiseEmail({ NODE_ENV: "development" })).toBe(true);
  });
});

describe("link de confirmação fora do email", () => {
  const config = {
    from: "ola@scoutknock.test",
    tokenSecret: "segredo",
    siteUrl: "https://scoutknock.test",
  };
  const build = (env: Record<string, string | undefined>) =>
    buildConfirmationEmail(config, "id-1", "a@b.test", env);

  it("existe em dev com o envio real desligado, sem domínio", () => {
    const { devConfirmPath } = build({ NODE_ENV: "development" });
    expect(devConfirmPath).toMatch(/^\/lista\/confirmar\?id=id-1&token=[0-9a-f]+$/);
  });

  it.each([
    ["produção com envio real", { NODE_ENV: "production", EMAIL_REAL_SENDING: "true" }],
    ["produção sem envio real", { NODE_ENV: "production" }],
    ["dev com envio real", { NODE_ENV: "development", EMAIL_REAL_SENDING: "true" }],
    ["testes", { NODE_ENV: "test" }],
    ["ambiente vazio", {}],
    ["valor parecido", { NODE_ENV: "Development" }],
  ])("não existe em %s", (_name, env) => {
    expect(canExposeEmailLinks(env)).toBe(false);
    expect(build(env).devConfirmPath).toBeNull();
  });

  it("o email continua a levar o link, para quem o recebe", () => {
    const { message: built } = build({
      NODE_ENV: "production",
      EMAIL_REAL_SENDING: "true",
    });
    expect(built.text).toContain("https://scoutknock.test/lista/confirmar?id=id-1");
    expect(built.to).toBe("a@b.test");
  });
});
