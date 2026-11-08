"use client";

import { Bookmark, BookmarkPlus, MapPin, Search, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { deleteSavedSearch, saveSearch, type SavedSearch } from "@/lib/radar/saved-searches";
import type { SearchQuery, ServiceId } from "@/lib/radar/types";
import type { Zone } from "@/lib/radar/zones";

const copy = ptPT.radar.idle;
const services = ptPT.radar.services;
const dayFormat = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short" });

// A pesquisa em frase, por cima do formulário: o que vai ser procurado, e guardá-la.
export function SearchSentence({ values, onSaved }: { values: SearchQuery; onSaved: (search: SavedSearch) => void }) {
  const [pending, startTransition] = useTransition();
  const ready = values.niche.trim() && values.locality.trim();
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4" data-testid="radar-sentence">
      <p className="text-18 leading-snug text-pretty">
        {copy.sentence.before}{" "}
        <strong className="font-semibold text-accent">{values.niche.trim() || copy.sentence.nichePending}</strong>{" "}
        {copy.sentence.in}{" "}
        <strong className="font-semibold text-accent">{values.locality.trim() || copy.sentence.localityPending}</strong>{" "}
        {copy.sentence.for} <strong className="font-semibold">{services[values.service as ServiceId].toLocaleLowerCase("pt-PT")}</strong>.
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        disabled={!ready || pending}
        onClick={() =>
          startTransition(async () => {
            const result = await saveSearch(values);
            if (result.ok) {
              onSaved(result.search);
              toast.success(copy.saved);
            } else {
              toast.error(copy.saveError);
            }
          })
        }
      >
        <BookmarkPlus aria-hidden="true" size={15} />
        {copy.save}
      </Button>
    </div>
  );
}

// Repouso: sem animação. As pesquisas guardadas e as zonas já exploradas.
export function RadarIdleSide({
  saved,
  zones,
  onUse,
  onRemoved,
  onLocality,
}: {
  saved: SavedSearch[];
  zones: Zone[];
  onUse: (search: SearchQuery) => void;
  onRemoved: (id: string) => void;
  onLocality: (locality: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-24" data-testid="radar-idle">
      <section aria-labelledby="radar-guardadas" className="panel flex flex-col gap-3 p-5">
        <h2 id="radar-guardadas" className="flex items-center gap-2 text-15 font-semibold">
          <Bookmark aria-hidden="true" size={16} className="text-accent" />
          {copy.savedTitle}
        </h2>
        {saved.length === 0 ? (
          <p className="text-14 text-muted">{copy.savedEmpty}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border-subtle" data-testid="radar-saved">
            {saved.map((search) => (
              <li key={search.id} className="flex items-center gap-2 py-2">
                <button
                  type="button"
                  onClick={() => onUse({ service: search.service as ServiceId, niche: search.niche, locality: search.locality })}
                  className="focus-ring flex min-h-10 min-w-0 flex-1 flex-col items-start rounded-sm text-left hovered:text-accent"
                >
                  <span className="truncate text-14 font-medium">{copy.savedLine(search.niche, search.locality)}</span>
                  <span className="text-13 text-muted">{services[search.service as ServiceId] ?? search.service}</span>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={copy.searchAgain(search.niche, search.locality)}
                  onClick={() => onUse({ service: search.service as ServiceId, niche: search.niche, locality: search.locality })}
                >
                  <Search aria-hidden="true" size={15} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending && removing === search.id}
                  aria-label={copy.remove(search.niche, search.locality)}
                  onClick={() => {
                    setRemoving(search.id);
                    startTransition(async () => {
                      const { ok } = await deleteSavedSearch(search.id);
                      if (ok) onRemoved(search.id);
                      else toast.error(copy.saveError);
                    });
                  }}
                >
                  <Trash2 aria-hidden="true" size={15} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="radar-zonas" className="panel flex flex-col gap-3 p-5">
        <h2 id="radar-zonas" className="flex items-center gap-2 text-15 font-semibold">
          <MapPin aria-hidden="true" size={16} className="text-accent" />
          {copy.zonesTitle}
        </h2>
        {zones.length === 0 ? (
          <p className="text-14 text-muted">{copy.zonesEmpty}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border-subtle" data-testid="radar-zones">
            {zones.map((zone) => (
              <li key={zone.locality}>
                <button
                  type="button"
                  onClick={() => onLocality(zone.locality)}
                  className="focus-ring flex min-h-11 w-full items-start justify-between gap-3 rounded-sm py-2 text-left hovered:text-accent"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-14 font-medium">{zone.locality}</span>
                    <span className="truncate text-13 text-muted">{zone.niches.join(", ")}</span>
                  </span>
                  <span className="shrink-0 text-right text-13 text-muted">
                    {copy.zoneLine(zone.searches, zone.companies)}
                    <br />
                    {dayFormat.format(new Date(zone.last))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
