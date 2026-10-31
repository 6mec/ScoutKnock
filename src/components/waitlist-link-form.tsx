"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { DrawnCheck } from "@/components/ui/drawn-check";
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
      <div role="status" className="flex flex-col items-start gap-4">
        <span className="inline-flex size-12 items-center justify-center rounded-pill bg-accent-soft">
          <DrawnCheck size={24} />
        </span>
        <p className="type-body">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="type-body">{body}</p>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="token" value={token} />
      <div aria-live="polite">
        {state.status === "error" && (
          <p role="alert" className="text-danger">
            {state.message}
          </p>
        )}
      </div>
      <Button
        type="submit"
        size="lg"
        loading={pending}
        loadingText={ptPT.waitlist.pending}
        className="w-full"
      >
        {submitLabel}
      </Button>
    </form>
  );
}
