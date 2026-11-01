import { ptPT } from "@/i18n/pt-PT";
import type { SiteCheckStatus } from "@/lib/radar/search-events";

export function SiteCheckNote({ status }: { status?: SiteCheckStatus }) {
  if (!status) return null;

  return (
    <p data-testid="site-check" className="text-13 text-muted">
      {ptPT.radar.siteCheck[status]}
    </p>
  );
}
