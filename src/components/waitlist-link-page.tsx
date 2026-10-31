import { Suspense } from "react";
import { AuthCard, AuthLink } from "@/components/auth-card";
import { AuthShell } from "@/components/auth-shell";
import { WaitlistLinkForm } from "@/components/waitlist-link-form";
import { ptPT } from "@/i18n/pt-PT";
import type { WaitlistState } from "@/lib/waitlist/actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type Props = {
  action: (state: WaitlistState, formData: FormData) => Promise<WaitlistState>;
  title: string;
  body: string;
  submitLabel: string;
  invalid: string;
  searchParams: SearchParams;
};

export function WaitlistLinkPage({ title, searchParams, ...props }: Props) {
  return (
    <AuthShell>
      <AuthCard title={title}>
        <Suspense fallback={<p className="text-muted">{props.body}</p>}>
          <LinkContent searchParams={searchParams} {...props} />
        </Suspense>
        <AuthLink href="/" className="self-start">
          {ptPT.waitlist.backHome}
        </AuthLink>
      </AuthCard>
    </AuthShell>
  );
}

async function LinkContent({
  action,
  body,
  submitLabel,
  invalid,
  searchParams,
}: Omit<Props, "title">) {
  const { id, token } = await searchParams;

  if (typeof id !== "string" || typeof token !== "string") {
    return <p className="type-body">{invalid}</p>;
  }

  return (
    <WaitlistLinkForm
      action={action}
      id={id}
      token={token}
      body={body}
      submitLabel={submitLabel}
    />
  );
}
