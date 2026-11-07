import { ptPT } from "@/i18n/pt-PT";
import type { FunnelStage } from "@/lib/dashboard/metrics";

const copy = ptPT.dashboard.funnel;

// Funil em barras horizontais, todas medidas pela primeira etapa. Cada linha diz o número
// e a percentagem da etapa anterior (texto, não só a cor).
export function Funnel({ data }: { data: { stage: FunnelStage; count: number }[] }) {
  const first = data[0]?.count ?? 0;
  if (first === 0) return <p className="text-14 text-muted">{copy.empty}</p>;

  return (
    <ol className="flex flex-col gap-3" data-testid="funnel">
      {data.map((item, index) => {
        const previous = index > 0 ? data[index - 1].count : null;
        const percent = previous ? Math.round((item.count / previous) * 100) : null;
        return (
          <li key={item.stage} data-testid={`funnel-${item.stage}`} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-14">
              <span>{copy.stages[item.stage]}</span>
              <span className="type-number">
                <span className="font-semibold">{item.count}</span>
                {percent !== null && <span className="text-13 text-muted"> · {copy.ofPrevious(percent)}</span>}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-border-subtle" aria-hidden="true">
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(item.count > 0 ? 2 : 0, (item.count / first) * 100)}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
