import Link from "next/link";
import { Logo } from "@/components/logo";
import { ptPT } from "@/i18n/pt-PT";

const { radar: copy } = ptPT;

export default function DashboardLayout({ children }: LayoutProps<"/painel">) {
  return (
    <>
      <header className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-4 px-4 pt-8">
        <Link href="/painel">
          <Logo />
        </Link>
        <nav aria-label={copy.navLabel}>
          <Link href="/painel/radar" className="font-bold hover:text-accent">
            {copy.title}
          </Link>
        </nav>
      </header>
      {children}
    </>
  );
}
