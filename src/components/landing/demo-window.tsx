"use client";

import { Monitor, Smartphone } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ptPT } from "@/i18n/pt-PT";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

const copy = ptPT.landing.show.window;

const VIEWS = [
  { id: "desktop", label: copy.desktop, Icon: Monitor },
  { id: "mobile", label: copy.mobile, Icon: Smartphone },
] as const;

export function DemoWindow() {
  const [view, setView] = useState<"desktop" | "mobile">("desktop");
  const reduced = useReducedMotion();
  const isMobile = view === "mobile";

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span aria-hidden="true" className="flex gap-2">
          <span className="size-2.5 rounded-pill bg-border" />
          <span className="size-2.5 rounded-pill bg-border" />
          <span className="size-2.5 rounded-pill bg-border" />
        </span>
        <span className="type-number ml-2 min-w-0 flex-1 truncate rounded-sm bg-background px-2.5 py-1 text-12 text-muted">
          {copy.url}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <Badge variant="amber">{copy.badge}</Badge>
        <div
          role="group"
          aria-label={copy.viewLabel}
          className="flex flex-wrap gap-1"
        >
          {VIEWS.map(({ id, label, Icon }) => (
            <Button
              key={id}
              size="sm"
              variant={view === id ? "secondary" : "ghost"}
              aria-pressed={view === id}
              onClick={() => setView(id)}
            >
              <Icon aria-hidden="true" size={16} strokeWidth={1.75} />
              {label}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex justify-center bg-background p-4">
        <motion.div
          layout={!reduced}
          transition={spring}
          className={cn(
            "w-full overflow-hidden rounded-md bg-foreground text-background",
            isMobile ? "max-w-65" : "max-w-full",
          )}
        >
          <motion.div layout={!reduced ? "position" : false} className="p-6">
            <div
              className={cn(
                "flex justify-between gap-3 font-bold",
                isMobile ? "flex-col" : "items-center",
              )}
            >
              <span>{copy.company}</span>
              <span className="text-13 font-medium">{copy.nav}</span>
            </div>
            <p className="type-heading mt-8 max-w-85 text-32">
              {copy.headline}
            </p>
            <span className="mt-4 inline-block rounded-sm bg-background px-4 py-2.5 text-14 font-semibold text-foreground">
              {copy.action}
            </span>
            <div
              aria-hidden="true"
              className={cn(
                "mt-8 grid gap-2.5",
                isMobile ? "grid-cols-1" : "grid-cols-3",
              )}
            >
              <div className="h-14 rounded-sm bg-background/20" />
              <div className="h-14 rounded-sm bg-background/20" />
              <div className="h-14 rounded-sm bg-background/20" />
            </div>
          </motion.div>
        </motion.div>
      </div>
      <p className="border-t border-border px-4 py-3 text-13 text-muted">
        {copy.notice}
      </p>
    </div>
  );
}
