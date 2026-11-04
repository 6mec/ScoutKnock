"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { ptPT } from "@/i18n/pt-PT";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-canvas/70 backdrop-blur-sm data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in print:hidden" />
      <DialogPrimitive.Content
        className={cn(
          // shrink-0: com conteúdo alto, o diálogo faz scroll em vez de esmagar os botões.
          "fixed inset-0 z-50 m-auto flex h-fit max-h-[85dvh] w-[calc(100%-32px)] max-w-md flex-col gap-4 overflow-y-auto rounded-lg border border-panel-border bg-surface p-6 shadow-float [&>*]:shrink-0",
          "focus-ring data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label={ptPT.ui.close}
          className="focus-ring absolute top-2 right-2 inline-flex size-11 items-center justify-center rounded-md text-muted transition-colors duration-(--duration-fast) ease-out hovered:text-foreground"
        >
          <X aria-hidden="true" size={18} strokeWidth={1.75} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("type-heading pr-10 text-20", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("type-body text-muted", className)}
      {...props}
    />
  );
}
