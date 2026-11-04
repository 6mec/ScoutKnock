"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { AddCompanyButton } from "@/components/contacts/add-company-button";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ptPT } from "@/i18n/pt-PT";
import { googleMapsSearchUrl } from "@/lib/contacts/manual";

const copy = ptPT.contacts.manual;
const { radar } = ptPT;

// Procurar à mão: o link abre o Google Maps noutro separador e não lê nada de lá.
// O freelancer escolhe as empresas e escreve-as aqui.
export function ManualSearchActions({
  niche,
  locality,
}: {
  niche: string;
  locality: string;
}) {
  return (
    <section
      aria-labelledby="procurar-a-mao"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5"
    >
      <h2 id="procurar-a-mao" className="font-semibold">
        {copy.manualTitle}
      </h2>
      <p className="text-14 text-muted">{copy.openMapsHint}</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <a
            href={googleMapsSearchUrl(niche, locality)}
            target="_blank"
            rel="noreferrer noopener"
          >
            <ExternalLink aria-hidden="true" size={16} strokeWidth={1.75} />
            {copy.openMaps}
          </a>
        </Button>
        <AddCompanyButton initial={{ niche, locality }} />
      </div>
    </section>
  );
}

// Sem fornecedor de empresas (sem chave), o Radar continua útil no modo manual.
export function ManualRadar() {
  const [niche, setNiche] = useState("");
  const [locality, setLocality] = useState("");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 lg:px-8">
      <p className="type-body rounded-md border border-amber px-4 py-3 text-amber">
        {copy.radarOff}
      </p>
      <div className="grid gap-4 rounded-lg border border-border bg-surface p-5 sm:grid-cols-2">
        <Field label={radar.nicheLabel}>
          <Input
            value={niche}
            placeholder={radar.nichePlaceholder}
            autoComplete="off"
            onChange={(event) => setNiche(event.target.value)}
          />
        </Field>
        <Field label={radar.localityLabel}>
          <Input
            value={locality}
            placeholder={radar.localityPlaceholder}
            autoComplete="off"
            onChange={(event) => setLocality(event.target.value)}
          />
        </Field>
      </div>
      <ManualSearchActions niche={niche} locality={locality} />
    </div>
  );
}
