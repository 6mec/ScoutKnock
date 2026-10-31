import Link from "next/link";
import { SystemMessage } from "@/components/system-message";
import { Button } from "@/components/ui/button";
import { ptPT } from "@/i18n/pt-PT";

const { system: copy } = ptPT;

export function NotFoundMessage({
  heading,
  href = "/",
}: {
  heading?: "h1" | "h2";
  href?: string;
}) {
  return (
    <SystemMessage
      title={copy.notFound}
      heading={heading}
      action={
        <Button asChild variant="secondary">
          <Link href={href}>{copy.home}</Link>
        </Button>
      }
    />
  );
}
