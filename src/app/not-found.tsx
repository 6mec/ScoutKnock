import type { Metadata } from "next";
import { NotFoundMessage } from "@/components/not-found-message";
import { ptPT } from "@/i18n/pt-PT";

export const metadata: Metadata = {
  title: ptPT.system.notFound,
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col">
      <NotFoundMessage />
    </main>
  );
}
