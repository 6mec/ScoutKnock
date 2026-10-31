"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ptPT } from "@/i18n/pt-PT";
import { joinWaitlist, type WaitlistState } from "@/lib/waitlist/actions";

const copy = ptPT.waitlist;
const initialState: WaitlistState = { status: "idle" };
const inputClass =
  "h-12 rounded-[12px] border border-border bg-background px-3 text-[16px] outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent";

export function WaitlistForm() {
  const [state, formAction, pending] = useActionState(
    joinWaitlist,
    initialState,
  );

  if (state.status === "success") {
    return (
      <p role="status" className="leading-[1.6]">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="waitlist-email" className="font-bold">
          {copy.emailLabel}
        </label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={copy.emailPlaceholder}
          required
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="waitlist-service" className="font-bold">
          {copy.serviceLabel}
        </label>
        <select
          id="waitlist-service"
          name="service"
          defaultValue=""
          className={inputClass}
        >
          <option value="">{copy.serviceEmpty}</option>
          {copy.services.map((service) => (
            <option key={service.value} value={service.value}>
              {service.label}
            </option>
          ))}
        </select>
      </div>
      {/* Campo invisível para apanhar bots. */}
      <div className="hidden" aria-hidden="true">
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-danger">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-[12px] bg-accent px-5 font-bold text-accent-contrast transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
      >
        {pending ? copy.pending : copy.submit}
      </button>
      <p className="text-[16px] sm:text-[14px] leading-[1.6] text-muted">
        {copy.privacyBefore}
        <Link href="/privacidade" className="text-accent underline">
          {copy.privacyLink}
        </Link>
        {copy.privacyAfter}
      </p>
    </form>
  );
}
