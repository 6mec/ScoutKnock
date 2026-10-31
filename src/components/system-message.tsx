import type { ReactNode } from "react";
import { RadarRings } from "@/components/landing/radar-rings";

// Base da 404 e do erro. Onde já há um h1 (painel), o título passa a h2.
export function SystemMessage({
  title,
  heading = "h1",
  action,
}: {
  title: string;
  heading?: "h1" | "h2";
  action: ReactNode;
}) {
  const Title = heading;

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-4 py-24 text-center">
      <RadarRings
        sweep
        className="top-1/2 left-1/2 size-160 -translate-x-1/2 -translate-y-1/2 opacity-55"
      />
      <Title className="type-display relative max-w-140 text-32 lg:text-44">
        {title}
      </Title>
      <div className="relative">{action}</div>
    </div>
  );
}
