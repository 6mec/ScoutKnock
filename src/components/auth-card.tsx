import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AuthCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-heading text-24">{title}</h1>
      {children}
    </div>
  );
}

export function AuthLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn("focus-ring rounded-sm text-accent underline", className)}
      {...props}
    />
  );
}
