"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requestNewSearch } from "@/lib/radar/new-search";

export function NewSearchLink({ children }: { children: string }) {
  return (
    <Button asChild size="lg">
      <Link href="/painel/radar" onClick={requestNewSearch}>
        {children}
      </Link>
    </Button>
  );
}
