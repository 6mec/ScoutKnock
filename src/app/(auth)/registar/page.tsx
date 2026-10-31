import type { Metadata } from "next";
import { AuthCard, AuthLink } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";
import { ptPT } from "@/i18n/pt-PT";
import { signUp } from "@/lib/auth/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/validation";

const { fields, signUp: copy } = ptPT.auth;

export const metadata: Metadata = { title: copy.title };

export default function SignUpPage() {
  return (
    <AuthCard title={copy.title}>
      <AuthForm
        action={signUp}
        submitLabel={copy.submit}
        fields={[
          {
            name: "email",
            label: fields.email,
            type: "email",
            autoComplete: "email",
          },
          {
            name: "password",
            label: fields.password,
            type: "password",
            autoComplete: "new-password",
            minLength: MIN_PASSWORD_LENGTH,
            hint: fields.passwordHint,
          },
        ]}
      />
      <p className="text-muted">
        {copy.hasAccount} <AuthLink href="/entrar">{copy.signInLink}</AuthLink>
      </p>
    </AuthCard>
  );
}
