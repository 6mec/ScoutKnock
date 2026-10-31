import type { Metadata } from "next";
import { AuthCard, AuthLink } from "@/components/auth-card";
import { ptPT } from "@/i18n/pt-PT";

const { invalidLink: copy } = ptPT.auth;

export const metadata: Metadata = { title: copy.title };

export default function InvalidLinkPage() {
  return (
    <AuthCard title={copy.title}>
      <p className="type-body">{copy.body}</p>
      <AuthLink href="/recuperar" className="self-start">
        {copy.action}
      </AuthLink>
    </AuthCard>
  );
}
