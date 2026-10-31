"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ptPT } from "@/i18n/pt-PT";
import { requestRepeatSearch } from "@/lib/radar/new-search";
import type { SearchQuery } from "@/lib/radar/types";

const { dashboard: copy } = ptPT;

// A busca só corre depois de confirmar, e nunca a partir do endereço: recarregar
// a página não pode gastar outra busca.
export function RepeatSearchButton({
  query,
  used,
  limit,
}: {
  query: SearchQuery;
  used: number;
  limit: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function confirm() {
    setOpen(false);
    requestRepeatSearch(query);
    router.push("/painel/radar");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          aria-label={copy.searches.repeatLabel(query.niche, query.locality)}
        >
          {copy.searches.repeat}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{copy.searches.confirmTitle}</DialogTitle>
        <DialogDescription>
          {copy.searches.confirmBody(used + 1, limit)}
        </DialogDescription>
        <div className="flex flex-wrap gap-2">
          <Button onClick={confirm}>{copy.searches.confirm}</Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {copy.searches.cancel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
