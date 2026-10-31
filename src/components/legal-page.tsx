import Link from "next/link";
import { Logo } from "@/components/logo";
import { ptPT } from "@/i18n/pt-PT";

export function LegalPage({
  title,
  paragraphs,
}: {
  title: string;
  paragraphs: string[];
}) {
  return (
    <main className="flex flex-1 w-full max-w-3xl mx-auto flex-col gap-8 px-4 py-12">
      <Link href="/" className="self-start">
        <Logo />
      </Link>
      <h1 className="text-[28px] leading-tight font-bold tracking-tight">
        {title}
      </h1>
      <p className="rounded-[12px] border border-amber p-4 text-amber">
        {ptPT.legal.reviewNotice}
      </p>
      <div className="flex flex-col gap-4 leading-[1.6]">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <Link href="/" className="text-accent underline">
        {ptPT.legal.backHome}
      </Link>
    </main>
  );
}
