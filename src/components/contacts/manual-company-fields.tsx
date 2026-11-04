"use client";

import { Field, Input, Select } from "@/components/ui/field";
import { ptPT } from "@/i18n/pt-PT";
import {
  MAX_MANUAL_ADDRESS,
  MAX_MANUAL_LOCALITY,
  MAX_MANUAL_NICHE,
  MAX_MANUAL_PHONE,
  MAX_MANUAL_WEBSITE,
  parseManualCompany,
  type ManualCompany,
} from "@/lib/contacts/manual";
import { MAX_LABEL } from "@/lib/contacts/rules";

const copy = ptPT.contacts.manual;

export type ManualForm = {
  name: string;
  niche: string;
  locality: string;
  phone: string;
  website: string;
  address: string;
  reviews: string;
  hours: "unknown" | "yes" | "no";
};

export function emptyManualForm(values: Partial<ManualForm> = {}): ManualForm {
  return {
    name: "",
    niche: "",
    locality: "",
    phone: "",
    website: "",
    address: "",
    reviews: "",
    hours: "unknown",
    ...values,
  };
}

export function manualFormOf(company: ManualCompany): ManualForm {
  return {
    name: company.name,
    niche: company.niche ?? "",
    locality: company.locality ?? "",
    phone: company.phone ?? "",
    website: company.website ?? "",
    address: company.address ?? "",
    reviews: company.reviews === null ? "" : String(company.reviews),
    hours: company.hours === null ? "unknown" : company.hours ? "yes" : "no",
  };
}

// O mesmo formato que o servidor valida, para a nota mudar enquanto se escreve.
export function manualInput(form: ManualForm) {
  return {
    ...form,
    reviews: form.reviews.trim() === "" ? null : form.reviews,
    hours: form.hours === "unknown" ? null : form.hours === "yes",
  };
}

export function parseManualForm(form: ManualForm) {
  return parseManualCompany(manualInput(form));
}

export function ManualCompanyFields({
  form,
  onChange,
  autoFocus = false,
}: {
  form: ManualForm;
  onChange: (form: ManualForm) => void;
  autoFocus?: boolean;
}) {
  const set = (change: Partial<ManualForm>) => onChange({ ...form, ...change });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={copy.name} className="sm:col-span-2">
        <Input
          value={form.name}
          maxLength={MAX_LABEL}
          autoComplete="off"
          autoFocus={autoFocus}
          required
          onChange={(event) => set({ name: event.target.value })}
        />
      </Field>
      <Field label={copy.niche}>
        <Input
          value={form.niche}
          maxLength={MAX_MANUAL_NICHE}
          autoComplete="off"
          onChange={(event) => set({ niche: event.target.value })}
        />
      </Field>
      <Field label={copy.locality}>
        <Input
          value={form.locality}
          maxLength={MAX_MANUAL_LOCALITY}
          autoComplete="off"
          onChange={(event) => set({ locality: event.target.value })}
        />
      </Field>
      <Field label={copy.phone}>
        <Input
          type="tel"
          value={form.phone}
          maxLength={MAX_MANUAL_PHONE}
          autoComplete="off"
          onChange={(event) => set({ phone: event.target.value })}
        />
      </Field>
      <Field label={copy.reviews} help={copy.reviewsHelp}>
        <Input
          inputMode="numeric"
          value={form.reviews}
          maxLength={7}
          autoComplete="off"
          onChange={(event) => set({ reviews: event.target.value })}
        />
      </Field>
      <Field label={copy.website} help={copy.websiteHelp} className="sm:col-span-2">
        <Input
          // Texto e não url: aceita "exemplo.pt" sem https://, que o servidor completa.
          inputMode="url"
          value={form.website}
          maxLength={MAX_MANUAL_WEBSITE}
          autoComplete="off"
          onChange={(event) => set({ website: event.target.value })}
        />
      </Field>
      <Field label={copy.address} className="sm:col-span-2">
        <Input
          value={form.address}
          maxLength={MAX_MANUAL_ADDRESS}
          autoComplete="off"
          onChange={(event) => set({ address: event.target.value })}
        />
      </Field>
      <Field label={copy.hours}>
        <Select
          value={form.hours}
          onChange={(event) => set({ hours: event.target.value as ManualForm["hours"] })}
        >
          <option value="unknown">{copy.hoursUnknown}</option>
          <option value="yes">{copy.hoursYes}</option>
          <option value="no">{copy.hoursNo}</option>
        </Select>
      </Field>
    </div>
  );
}
