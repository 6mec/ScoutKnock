import type { Metadata } from "next";
import { WaitlistLinkPage } from "@/components/waitlist-link-page";
import { ptPT } from "@/i18n/pt-PT";
import { leaveWaitlist } from "@/lib/waitlist/actions";

const { leave: copy } = ptPT.waitlist;

export const metadata: Metadata = {
  title: copy.title,
  robots: { index: false },
};

export default function LeaveWaitlistPage({
  searchParams,
}: PageProps<"/lista/sair">) {
  return (
    <WaitlistLinkPage
      action={leaveWaitlist}
      title={copy.title}
      body={copy.body}
      submitLabel={copy.submit}
      invalid={copy.invalid}
      searchParams={searchParams}
    />
  );
}
