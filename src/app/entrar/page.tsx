import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";
import { ptPT } from "@/i18n/pt-PT";
import { signIn } from "@/lib/auth/actions";

const { fields, signIn: copy } = ptPT.auth;

export const metadata: Metadata = { title: copy.title };

export default function SignInPage() {
  return (
    <AuthCard title={copy.title}>
      <AuthForm
        action={signIn}
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
            autoComplete: "current-password",
          },
        ]}
      />
      <div className="flex flex-col gap-2 text-muted">
        <Link href="/recuperar" className="text-accent underline">
          {copy.forgot}
        </Link>
        <p>
          {copy.noAccount}{" "}
          <Link href="/registar" className="text-accent underline">
            {copy.signUpLink}
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
