"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { ptPT } from "@/i18n/pt-PT";

export function PlanSubmitButton({
  variant,
  children,
}: {
  variant?: ButtonVariant;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      loading={pending}
      loadingText={ptPT.plans.pending}
    >
      {children}
    </Button>
  );
}
