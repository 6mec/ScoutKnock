"use client";

import { CircleAlert } from "lucide-react";
import type { CSSProperties } from "react";
import { Toaster as SonnerToaster } from "sonner";
import { DrawnCheck } from "@/components/ui/drawn-check";

export { toast } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      icons={{
        success: <DrawnCheck />,
        error: (
          <CircleAlert
            aria-hidden="true"
            size={18}
            strokeWidth={1.75}
            className="text-danger"
          />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--surface-raised)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-md)",
          "--font-family": "var(--font-sans)",
        } as CSSProperties
      }
      toastOptions={{ style: { boxShadow: "var(--elevation-float)" } }}
    />
  );
}
