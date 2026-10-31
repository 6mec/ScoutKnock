"use client";

import { ErrorMessage } from "@/components/error-message";

export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col">
      <ErrorMessage error={error} retry={retry} />
    </main>
  );
}
