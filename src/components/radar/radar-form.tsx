"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { ptPT } from "@/i18n/pt-PT";
import { LOCALITIES } from "@/lib/radar/localities";
import { MAX_FILTER_LENGTH } from "@/lib/radar/search-events";
import { SERVICE_IDS, type SearchQuery, type ServiceId } from "@/lib/radar/types";

const { radar: copy } = ptPT;

export function RadarForm({
  values,
  onChange,
  onSubmit,
  focusOnMount,
}: {
  values: SearchQuery;
  onChange: (values: SearchQuery) => void;
  onSubmit: () => void;
  focusOnMount: boolean;
}) {
  const nicheRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusOnMount) nicheRef.current?.focus();
  }, [focusOnMount]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6"
    >
      <p className="type-body text-muted">{copy.empty}</p>
      <Field label={copy.serviceLabel}>
        <Select
          value={values.service}
          onChange={(event) =>
            onChange({ ...values, service: event.target.value as ServiceId })
          }
        >
          {SERVICE_IDS.map((id) => (
            <option key={id} value={id}>
              {copy.services[id]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={copy.nicheLabel}>
        <Input
          ref={nicheRef}
          list="radar-niches"
          value={values.niche}
          onChange={(event) => onChange({ ...values, niche: event.target.value })}
          placeholder={copy.nichePlaceholder}
          maxLength={MAX_FILTER_LENGTH}
          autoComplete="off"
          required
        />
      </Field>
      <Field label={copy.localityLabel}>
        <Input
          list="radar-localities"
          value={values.locality}
          onChange={(event) =>
            onChange({ ...values, locality: event.target.value })
          }
          placeholder={copy.localityPlaceholder}
          maxLength={MAX_FILTER_LENGTH}
          autoComplete="off"
          required
        />
      </Field>
      <datalist id="radar-niches">
        {ptPT.landing.niches.map((niche) => (
          <option key={niche} value={niche} />
        ))}
      </datalist>
      <datalist id="radar-localities">
        {LOCALITIES.map(({ name }) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <Button type="submit" size="lg" className="w-full">
        {copy.submit}
      </Button>
    </form>
  );
}
