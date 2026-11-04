"use client";

import { ExternalLink, MapPinned } from "lucide-react";
import { useState } from "react";
import { AddCompanyButton } from "@/components/contacts/add-company-button";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Field, Input } from "@/components/ui/field";
import { PanelHeader } from "@/components/ui/panel-header";
import { ptPT } from "@/i18n/pt-PT";
import { googleMapsSearchUrl } from "@/lib/contacts/manual";

const copy = ptPT.contacts.manual;
const { radar } = ptPT;

// Procurar à mão: o link abre o Google Maps noutro separador e não lê nada de lá.
// O freelancer escolhe as empresas e escreve-as aqui.
export function ManualSearchActions({
  niche,
  locality,
  children,
}: {
  niche: string;
  locality: string;
  children?: React.ReactNode;
}) {
  return (
    <section aria-labelledby="procurar-a-mao" className="panel flex flex-col gap-5 p-5">
      <PanelHeader
        id="procurar-a-mao"
        icon={MapPinned}
        title={copy.manualTitle}
        description={copy.openMapsHint}
      />
      {children}
      <div className="flex flex-wrap gap-2">
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8 lg:px-8">
      <Callout tone="amber">{copy.radarOff}</Callout>
      <ManualSearchActions niche={niche} locality={locality}>
      <div className="grid gap-4 sm:grid-cols-2">
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
      </ManualSearchActions>
    </div>
  );
}
