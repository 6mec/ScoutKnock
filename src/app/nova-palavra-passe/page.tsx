import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";
import { ptPT } from "@/i18n/pt-PT";
import { updatePassword } from "@/lib/auth/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/validation";

const { fields, newPassword: copy } = ptPT.auth;

export const metadata: Metadata = { title: copy.title };

export default function NewPasswordPage() {
  return (
    <AuthCard title={copy.title}>
      <AuthForm
        action={updatePassword}
        submitLabel={copy.submit}
        fields={[
          {
            name: "password",
            label: fields.newPassword,
            type: "password",
            autoComplete: "new-password",
            minLength: MIN_PASSWORD_LENGTH,
            hint: fields.passwordHint,
          },
        ]}
      />
    </AuthCard>
  );
}
