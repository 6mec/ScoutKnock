import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ptPT } from "@/i18n/pt-PT";
import { cn } from "@/lib/utils";

const { footer } = ptPT.landing;
const PAGES = [
  { href: "/privacidade", label: footer.privacy },
  { href: "/termos", label: footer.terms },
  { href: "/contacto", label: footer.contact },
];

export function LegalPage({
  href,
  title,
  paragraphs,
}: {
  href: string;
  title: string;
  paragraphs: string[];
}) {
  return (
    <div className="mx-auto flex w-full max-w-240 flex-1 flex-col gap-10 px-4 py-10 lg:px-10">
      <header>
        <Link
          href="/"
          aria-label={ptPT.auth.homeLink}
          className="focus-ring inline-flex rounded-sm"
        >
          <Logo />
        </Link>
      </header>
      <div className="grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-14">
        <nav aria-label={ptPT.legal.navLabel}>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 lg:sticky lg:top-10 lg:flex-col">
            {PAGES.map((page) => (
              <li key={page.href}>
                <Link
                  href={page.href}
                  aria-current={page.href === href ? "page" : undefined}
                  className={cn(
                    "focus-ring inline-flex min-h-11 items-center rounded-sm text-14 text-muted hovered:text-foreground",
                    page.href === href && "font-semibold text-foreground",
                  )}
                >
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="flex max-w-[70ch] flex-col gap-6">
          <h1 className="type-display text-32 lg:text-44">{title}</h1>
          <p className="rounded-md border border-amber p-4 text-amber">
            {ptPT.legal.reviewNotice}
          </p>
          <div className="type-body flex flex-col gap-4">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <Link
            href="/"
            className="focus-ring self-start rounded-sm text-accent underline"
          >
            {ptPT.legal.backHome}
          </Link>
        </main>
      </div>
    </div>
  );
}
