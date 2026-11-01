"use client";

import { Plus } from "lucide-react";
import { Accordion } from "radix-ui";
import { ptPT } from "@/i18n/pt-PT";

const { faq } = ptPT.landing;

export function Faq({ withBrazil }: { withBrazil: boolean }) {
  const items = faq.items.map((item) =>
    withBrazil && item.question === faq.withBrazil.replaces ? faq.withBrazil : item,
  );

  return (
    <Accordion.Root type="multiple" className="border-t border-border">
      {items.map((item) => (
        <Accordion.Item
          key={item.question}
          value={item.question}
          className="border-b border-border"
        >
          <Accordion.Header>
            <Accordion.Trigger className="group focus-ring flex min-h-11 w-full items-center justify-between gap-4 rounded-sm py-5 text-left text-18 font-semibold">
              {item.question}
              <Plus
                aria-hidden="true"
                size={20}
                strokeWidth={1.75}
                className="shrink-0 text-muted transition-transform duration-(--duration-fast) ease-out group-data-[state=open]:rotate-45"
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <p className="type-body pb-5 text-muted">{item.answer}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
