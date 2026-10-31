import Image from "next/image";
import { ptPT } from "@/i18n/pt-PT";

export default function Home() {
  const { brand } = ptPT;

  return (
    <main className="flex flex-1 w-full max-w-3xl mx-auto flex-col justify-center gap-10 px-6 py-16">
      <div className="flex items-center gap-3">
        <Image
          src="/brand/scoutknock-mark.svg"
          alt=""
          width={40}
          height={40}
          priority
        />
        <p className="text-[20px] font-bold tracking-tight">
          <span className="text-foreground">{brand.scout}</span>
          <span className="text-accent">{brand.knock}</span>
        </p>
      </div>
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
