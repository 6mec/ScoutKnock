"use client";

import { Avatar as AvatarPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

// Se a imagem faltar ou falhar, mostra as iniciais.
export function Avatar({
  src,
  alt,
  initials,
  className,
}: {
  src?: string;
  alt: string;
  initials: string;
  className?: string;
}) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-pill border border-border-strong bg-surface-raised",
        className,
      )}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={alt}
          className="size-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        aria-label={alt}
        className="type-number text-13 text-foreground"
      >
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
