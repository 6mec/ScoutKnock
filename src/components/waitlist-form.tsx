"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { DrawnCheck } from "@/components/ui/drawn-check";
import { Field, Input, Select } from "@/components/ui/field";
import { ptPT } from "@/i18n/pt-PT";
import { joinWaitlist, type WaitlistState } from "@/lib/waitlist/actions";

const copy = ptPT.waitlist;
const initialState: WaitlistState = { status: "idle" };

export function WaitlistForm() {
  const [state, formAction, pending] = useActionState(
    joinWaitlist,
    initialState,
  );

  if (state.status === "success") {
    return (
      <div role="status" className="flex flex-col items-start gap-4 py-4">
        <span className="inline-flex size-12 items-center justify-center rounded-pill bg-accent-soft">
          <DrawnCheck size={24} />
        </span>
        <p className="type-body text-18">{state.message}</p>
        {/* Em produção, o compilador retira este bloco por completo. */}
        {process.env.NODE_ENV === "development" && state.devConfirmPath && (
          <p className="rounded-md border border-amber p-3 text-14">
            {copy.devLinkNotice}{" "}
            <Link
              href={state.devConfirmPath}
              className="focus-ring rounded-sm text-accent underline"
            >
              {copy.devLink}
            </Link>
          </p>
        )}
      </div>
    );
  }

  const emailError =
    state.status === "error" && state.message === copy.messages.invalidEmail
      ? state.message
      : undefined;
  const formError =
    state.status === "error" && !emailError ? state.message : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label={copy.emailLabel} error={emailError}>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          placeholder={copy.emailPlaceholder}
          required
        />
      </Field>
      <Field label={copy.serviceLabel}>
        <Select name="service" defaultValue="">
          <option value="">{copy.serviceEmpty}</option>
          {copy.services.map((service) => (
            <option key={service.value} value={service.value}>
              {service.label}
            </option>
          ))}
        </Select>
      </Field>
      {/* Campo invisível para apanhar bots. */}
      <div className="hidden" aria-hidden="true">
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div aria-live="polite">
        {formError && (
          <p role="alert" className="text-danger">
            {formError}
          </p>
        )}
      </div>
      <Button
        type="submit"
        size="lg"
        loading={pending}
        loadingText={copy.pending}
        className="w-full"
      >
        {copy.submit}
      </Button>
      <p className="text-13 leading-[1.6] text-muted">
        {copy.privacyBefore}
        <Link href="/privacidade" className="focus-ring rounded-sm text-accent underline">
          {copy.privacyLink}
        </Link>
        {copy.privacyAfter}
      </p>
    </form>
  );
}
