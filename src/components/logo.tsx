import Image from "next/image";
import { ptPT } from "@/i18n/pt-PT";

export function Logo() {
  const { brand } = ptPT;

  return (
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
  );
}
