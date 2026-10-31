"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// 28 px à vista, com área de toque de 44 px.
export function Switch({
  className,
  ...props
}: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "focus-ring relative h-7 w-12 shrink-0 rounded-pill border border-border-input bg-background transition-colors duration-(--duration-fast) ease-out",
        "before:absolute before:-inset-2 before:content-['']",
        "data-[state=checked]:border-accent data-[state=checked]:bg-accent",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-pill bg-muted transition-transform duration-(--duration-fast) ease-out data-[state=checked]:translate-x-6 data-[state=checked]:bg-accent-contrast" />
    </SwitchPrimitive.Root>
  );
}
