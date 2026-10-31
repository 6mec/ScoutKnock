import { ScoreChip } from "@/components/ui/score-chip";
import { ptPT } from "@/i18n/pt-PT";

// A nota fica como estava quando a empresa foi guardada.
export function ContactScore({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-2 text-13 text-muted">
      {ptPT.radar.scoreLabel}
      <ScoreChip score={score} />
    </span>
  );
}
