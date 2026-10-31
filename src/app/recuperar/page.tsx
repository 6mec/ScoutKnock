import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";
import { ptPT } from "@/i18n/pt-PT";
import { requestPasswordReset } from "@/lib/auth/actions";

const { fields, reset: copy } = ptPT.auth;

export const metadata: Metadata = { title: copy.title };

export default function ResetPage() {
  return (
    <AuthCard title={copy.title}>
      <p className="leading-[1.6] text-muted">{copy.intro}</p>
      <AuthForm
        action={requestPasswordReset}
        submitLabel={copy.submit}
        fields={[
          {
            name: "email",
            label: fields.email,
            type: "email",
            autoComplete: "email",
          },
        ]}
      />
      <Link href="/entrar" className="text-accent underline">
        {copy.backToSignIn}
      </Link>
    </AuthCard>
  );
}
