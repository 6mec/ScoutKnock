"use client";

import { ErrorMessage } from "@/components/error-message";

export default function PanelError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorMessage error={error} retry={retry} heading="h2" />;
}
