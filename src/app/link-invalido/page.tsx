import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { ptPT } from "@/i18n/pt-PT";

const { invalidLink: copy } = ptPT.auth;

export const metadata: Metadata = { title: copy.title };

export default function InvalidLinkPage() {
  return (
    <AuthCard title={copy.title}>
      <p className="leading-[1.6]">{copy.body}</p>
      <Link href="/recuperar" className="text-accent underline">
        {copy.action}
      </Link>
    </AuthCard>
  );
}
