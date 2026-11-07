"use client";

import { useState } from "react";
import { ptPT } from "@/i18n/pt-PT";
import { cn } from "@/lib/utils";

const copy = ptPT.dashboard.chart;
const money = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const monthShort = new Intl.DateTimeFormat("pt-PT", { month: "short", timeZone: "UTC" });
const monthLong = new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric", timeZone: "UTC" });
const asDate = (month: string) => new Date(`${month}-01T00:00:00Z`);
const short = (month: string) => monthShort.format(asDate(month)).replace(".", "");

const WIDTH = 600;
const HEIGHT = 200;
const TOP = 24;
const BOTTOM = 28;
const RADIUS = 4;

// Barra com os cantos de cima arredondados e assente na linha de base.
function barPath(x: number, width: number, top: number, base: number) {
  const r = Math.min(RADIUS, width / 2, base - top);
  return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + width - r} Q${x + width},${top} ${x + width},${top + r} V${base} Z`;
}

// Recebido nos últimos meses: uma só série, sem legenda (o título diz o que é). O valor
// aparece ao passar o rato ou com o teclado; a tabela escondida serve os leitores de ecrã.
export function MonthChart({ data }: { data: { month: string; total: number }[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...data.map((item) => item.total), 0);
  const base = HEIGHT - BOTTOM;
  const step = WIDTH / data.length;
  const barWidth = Math.min(36, step * 0.45);
  const current = data.length - 1;
  const shown = active ?? (data[current]?.total > 0 ? current : null);
  const total = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="flex flex-col gap-2" data-testid="month-chart">
      <div className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-auto w-full" aria-hidden="true">
          <line x1={0} x2={WIDTH} y1={base} y2={base} className="stroke-border" strokeWidth={1} />
          <line x1={0} x2={WIDTH} y1={TOP} y2={TOP} className="stroke-border-subtle" strokeWidth={1} strokeDasharray="3 4" />
          {data.map((item, index) => {
            const x = index * step + (step - barWidth) / 2;
            const height = max > 0 ? ((base - TOP) * item.total) / max : 0;
            const top = base - height;
            return (
              <g key={item.month}>
                {item.total > 0 && (
                  <path
                    d={barPath(x, barWidth, top, base)}
                    className={cn("fill-accent transition-opacity duration-(--duration-fast)", active !== null && active !== index && "opacity-40")}
                  />
                )}
                {shown === index && item.total > 0 && (
                  <text x={x + barWidth / 2} y={top - 8} textAnchor="middle" className="fill-foreground text-[13px] font-semibold tabular-nums">
                    {money.format(item.total)}
                  </text>
                )}
                <text x={index * step + step / 2} y={HEIGHT - 8} textAnchor="middle" className="fill-muted text-[13px]">
                  {short(item.month)}
                </text>
              </g>
            );
          })}
        </svg>
        {/* Zonas de toque maiores que as barras, uma por mês. */}
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
          {data.map((item, index) => (
            <button
              key={item.month}
              type="button"
              aria-label={`${monthLong.format(asDate(item.month))}: ${money.format(item.total)}`}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              className="focus-ring rounded-sm"
            />
          ))}
        </div>
      </div>
      <p className="type-number text-13 text-muted">{copy.total(money.format(total))}</p>
      <table className="sr-only">
        <thead>
          <tr>
            <th scope="col">{copy.tableMonth}</th>
            <th scope="col">{copy.tableTotal}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.month}>
              <td>{monthLong.format(asDate(item.month))}</td>
              <td>{money.format(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
