"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

// Um bloco que se pode esconder (por exemplo, "Primeiros passos"). Fica só neste browser:
// é uma preferência de quem vê, não altera dados. Sem armazenamento, o bloco aparece.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isHidden(key: string) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function DismissibleArea({
  storageKey,
  className,
  children,
}: {
  storageKey: string;
  className?: string;
  children: ReactNode;
}) {
  const hidden = useSyncExternalStore(subscribe, () => isHidden(storageKey), () => false);
  if (hidden) return null;
  return <div className={className}>{children}</div>;
}

export function DismissButton({ storageKey, label }: { storageKey: string; label: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        try {
          localStorage.setItem(storageKey, "1");
        } catch {
          return;
        }
        listeners.forEach((listener) => listener());
      }}
    >
      {label}
    </Button>
  );
}
