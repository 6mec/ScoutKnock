import type { Metadata } from "next";
import { WaitlistLinkPage } from "@/components/waitlist-link-page";
import { ptPT } from "@/i18n/pt-PT";
import { confirmWaitlist } from "@/lib/waitlist/actions";

const { confirm: copy } = ptPT.waitlist;

export const metadata: Metadata = {
  title: copy.title,
  robots: { index: false },
};

export default function ConfirmWaitlistPage({
  searchParams,
}: PageProps<"/lista/confirmar">) {
  return (
    <WaitlistLinkPage
      action={confirmWaitlist}
      title={copy.title}
      body={copy.body}
      submitLabel={copy.submit}
      invalid={copy.invalid}
      searchParams={searchParams}
    />
  );
}
