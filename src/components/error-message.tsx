"use client";

import { useEffect } from "react";
import { SystemMessage } from "@/components/system-message";
import { Button } from "@/components/ui/button";
import { ptPT } from "@/i18n/pt-PT";
import { reportPageError } from "@/lib/events/report-page-error";

const { system: copy } = ptPT;

// Só o código do erro vai para o servidor; a mensagem pode trazer dados pessoais.
export function ErrorMessage({
  error,
  retry,
  heading,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  heading?: "h1" | "h2";
}) {
  useEffect(() => {
    reportPageError(error.digest).catch(() => {});
  }, [error.digest]);

  return (
    <SystemMessage
      title={copy.error}
      heading={heading}
      action={<Button onClick={retry}>{copy.retry}</Button>}
    />
  );
}
