"use client";

import { CircleAlert } from "lucide-react";
import type { CSSProperties } from "react";
import { Toaster as SonnerToaster } from "sonner";

export { toast } from "sonner";

function DrawnCheck() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-accent"
    >
      <path
        d="M5 13l4 4L19 7"
        pathLength={1}
        strokeDasharray={1}
        className="animate-draw-check"
      />
    </svg>
  );
}

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
