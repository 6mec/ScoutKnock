import { Logo } from "@/components/logo";
import { ptPT } from "@/i18n/pt-PT";

export default function Home() {
  const { brand } = ptPT;

  return (
    <main className="flex flex-1 w-full max-w-3xl mx-auto flex-col justify-center gap-10 px-6 py-16">
      <Logo />
      <div className="flex flex-col gap-4">
        <h1 className="text-[40px] leading-tight font-bold tracking-tight">
          {brand.slogan}
        </h1>
        <p className="max-w-xl text-[20px] leading-[1.6] text-muted">
          {brand.tagline}
        </p>
      </div>
    </main>
  );
}
