"use client";

import { useActionState } from "react";
import { ptPT } from "@/i18n/pt-PT";
import type { WaitlistState } from "@/lib/waitlist/actions";

const initialState: WaitlistState = { status: "idle" };

// Pede um clique, para os filtros de email não confirmarem nem apagarem sozinhos.
export function WaitlistLinkForm({
  action,
  id,
  token,
  body,
  submitLabel,
}: {
  action: (state: WaitlistState, formData: FormData) => Promise<WaitlistState>;
  id: string;
  token: string;
  body: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  if (state.status === "success") {
    return (
      <p role="status" className="leading-[1.6]">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="leading-[1.6]">{body}</p>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="token" value={token} />
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
        {pending ? ptPT.waitlist.pending : submitLabel}
      </button>
    </form>
  );
}
