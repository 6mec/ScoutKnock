import { ptPT } from "@/i18n/pt-PT";
import { cn } from "@/lib/utils";

const copy = ptPT.radar;

// Atribuição obrigatória da licença ODbL: sempre visível onde aparecem dados do OpenStreetMap.
export function OsmAttribution({ prefix, className }: { prefix?: string; className?: string }) {
  return (
    <p data-testid="osm-attribution" className={cn("text-13 text-muted", className)}>
      {prefix && <>{prefix} · </>}
      {copy.attributionOsm} ·{" "}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer noopener"
        className="focus-ring rounded-sm underline"
      >
        {copy.attributionOsmLink}
        <span className="sr-only"> {ptPT.demos.view.newTab}</span>
      </a>
    </p>
  );
}
