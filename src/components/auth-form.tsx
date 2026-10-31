"use client";

import { useActionState } from "react";
import { ptPT } from "@/i18n/pt-PT";
import type { AuthFormState } from "@/lib/auth/actions";

type Field = {
  name: string;
  label: string;
  type: "email" | "password";
  autoComplete: string;
  minLength?: number;
  hint?: string;
};

const initialState: AuthFormState = { status: "idle" };

export function AuthForm({
  action,
  fields,
  submitLabel,
}: {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  fields: Field[];
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
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-2">
          <label htmlFor={field.name} className="font-bold">
            {field.label}
          </label>
          <input
            id={field.name}
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            minLength={field.minLength}
            required
            className="h-12 rounded-[12px] border border-border bg-background px-3 text-[16px] outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent"
          />
          {field.hint && <p className="text-[14px] text-muted">{field.hint}</p>}
        </div>
      ))}
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
        {pending ? ptPT.auth.pending : submitLabel}
      </button>
    </form>
  );
}
