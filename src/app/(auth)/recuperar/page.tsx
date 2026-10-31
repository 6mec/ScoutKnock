import type { Metadata } from "next";
import { AuthCard, AuthLink } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";
import { ptPT } from "@/i18n/pt-PT";
import { requestPasswordReset } from "@/lib/auth/actions";

const { fields, reset: copy } = ptPT.auth;

export const metadata: Metadata = { title: copy.title };

export default function ResetPage() {
  return (
    <AuthCard title={copy.title}>
      <AuthForm
        action={requestPasswordReset}
        submitLabel={copy.submit}
        intro={<p className="type-body text-muted">{copy.intro}</p>}
        fields={[
          {
            name: "email",
            label: fields.email,
            type: "email",
            autoComplete: "email",
          },
        ]}
      />
      <AuthLink href="/entrar" className="self-start">
        {copy.backToSignIn}
      </AuthLink>
    </AuthCard>
  );
}
