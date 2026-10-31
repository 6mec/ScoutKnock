"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

// O Next guarda este ecrã escondido: ao voltar, os números têm de ser os de agora.
export function RefreshOnShow() {
  const router = useRouter();
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    router.refresh();
  }, [router]);

  return null;
}
