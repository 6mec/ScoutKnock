"use client";

import {
  useActionState,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { DrawnCheck } from "@/components/ui/drawn-check";
import { Field, Input, PasswordInput } from "@/components/ui/field";
import { ptPT } from "@/i18n/pt-PT";
import type { AuthFormState } from "@/lib/auth/actions";
import { isValidEmail, isValidPassword } from "@/lib/auth/validation";

type AuthField = {
  name: string;
  label: string;
  type: "email" | "password";
  autoComplete: string;
  minLength?: number;
  hint?: string;
};

const { errors, fields: fieldCopy, pending: pendingLabel } = ptPT.auth;
const initialState: AuthFormState = { status: "idle" };
const SERVER_FIELD_ERRORS: Record<string, AuthField["type"]> = {
  [errors.invalidEmail]: "email",
  [errors.shortPassword]: "password",
  [errors.samePassword]: "password",
};

// Ao entrar não se valida o tamanho: a palavra-passe pode ser anterior à regra.
function validate(field: AuthField, value: string) {
  if (field.type === "email") {
    return isValidEmail(value.trim()) ? undefined : errors.invalidEmail;
  }
  if (field.minLength && !isValidPassword(value)) return errors.shortPassword;
  return undefined;
}

type AuthFormProps = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  fields: AuthField[];
  submitLabel: string;
  intro?: ReactNode;
};

// O Next guarda o ecrã anterior escondido, com o estado. Ao sair, recomeça do zero
// para a palavra-passe escrita não ficar em memória nem reaparecer ao voltar.
export function AuthForm(props: AuthFormProps) {
  const [instance, setInstance] = useState(0);

  useEffect(() => () => setInstance((current) => current + 1), []);

  return <AuthFormBody key={instance} {...props} />;
}

function AuthFormBody({ action, fields, submitLabel, intro }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [values, setValues] = useState<Record<string, string>>({});
  const [clientErrors, setClientErrors] = useState<Record<string, string | undefined>>({});
  // A resposta do servidor deixa de se mostrar quando a pessoa volta a escrever.
  const [dismissed, setDismissed] = useState<AuthFormState | null>(null);

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

  const serverError =
    state.status === "error" && state !== dismissed ? state.message : undefined;
  const serverFieldType = serverError ? SERVER_FIELD_ERRORS[serverError] : undefined;
  const formError = serverFieldType ? undefined : serverError;

  function handleChange(field: AuthField, value: string) {
    setValues((current) => ({ ...current, [field.name]: value }));
    setDismissed(state);
    // Só apaga um erro já visível; não acusa enquanto a pessoa ainda escreve.
    if (clientErrors[field.name] && !validate(field, value)) {
      setClientErrors((current) => ({ ...current, [field.name]: undefined }));
    }
  }

  function handleBlur(field: AuthField) {
    const value = values[field.name] ?? "";
    if (!value) return;
    setClientErrors((current) => ({
      ...current,
      [field.name]: validate(field, value),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const found = Object.fromEntries(
      fields.map((field) => [field.name, validate(field, values[field.name] ?? "")]),
    );
    const firstInvalid = fields.find((field) => found[field.name]);
    if (!firstInvalid) return;

    event.preventDefault();
    setClientErrors(found);
    const control = event.currentTarget.elements.namedItem(firstInvalid.name);
    if (control instanceof HTMLInputElement) control.focus();
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4"
    >
      {intro}
      {fields.map((field) => {
        const controlProps = {
          name: field.name,
          autoComplete: field.autoComplete,
          value: values[field.name] ?? "",
          onChange: (event: ChangeEvent<HTMLInputElement>) =>
            handleChange(field, event.target.value),
          onBlur: () => handleBlur(field),
          required: true,
        };
        return (
          <Field
            key={field.name}
            label={field.label}
            help={field.hint}
            error={
              clientErrors[field.name] ??
              (serverFieldType === field.type ? serverError : undefined)
            }
          >
            {field.type === "password" ? (
              <PasswordInput
                {...controlProps}
                showLabel={fieldCopy.showPassword}
                hideLabel={fieldCopy.hidePassword}
              />
            ) : (
              <Input {...controlProps} type={field.type} />
            )}
          </Field>
        );
      })}
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
        loadingText={pendingLabel}
        className="w-full"
      >
        {submitLabel}
      </Button>
    </form>
  );
}
