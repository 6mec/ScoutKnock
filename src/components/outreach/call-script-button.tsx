"use client";

import { Copy, Phone, PhoneCall } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { buildCallScript, callScriptText } from "@/lib/outreach/rules";
import type { ReasonCode } from "@/lib/radar/types";

const { outreach: copy } = ptPT;

// Guião para ligar a quem só tem telefone. Feito no browser a partir dos motivos da
// nota: não chama a IA nem gasta nada.
export function CallScriptButton({
  companyName,
  niche,
  reasons,
  senderName,
  phone,
}: {
  companyName: string;
  niche: string;
  reasons: ReasonCode[];
  senderName: string | null;
  phone?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const script = buildCallScript({ companyName, niche, reasons, senderName });
  const title = copy.call.title(companyName);

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(callScriptText(title, script));
      toast.success(copy.call.copied);
    } catch {
      toast.error(ptPT.messages.copyFailed);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" data-testid="call-script-open">
          <PhoneCall aria-hidden="true" size={16} />
          {copy.call.open}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{copy.call.intro}</DialogDescription>
        <div data-testid="call-script" className="flex flex-col gap-4">
          <Section label={copy.call.sections.opening}>
            <p>{script.opening}</p>
          </Section>
          <Section label={copy.call.sections.why}>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {script.why.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Section>
          <Section label={copy.call.sections.questions}>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {script.questions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Section>
          <Section label={copy.call.sections.objections}>
            <dl className="flex flex-col gap-2">
              {script.objections.map(({ they, you }) => (
                <div key={they} className="panel-row p-3">
                  <dt className="text-14 font-semibold">“{they}”</dt>
                  <dd className="mt-1 text-14 text-muted">{you}</dd>
                </div>
              ))}
            </dl>
          </Section>
          <Section label={copy.call.sections.next}>
            <p>{script.next}</p>
          </Section>
          <Section label={copy.call.sections.voicemail}>
            <p>{script.voicemail}</p>
          </Section>
        </div>
        <div className="flex flex-wrap gap-2">
          {phone?.trim() && (
            <Button asChild>
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                <Phone aria-hidden="true" size={16} />
                {copy.call.call}
              </a>
            </Button>
          )}
          <Button variant="secondary" onClick={copyScript}>
            <Copy aria-hidden="true" size={16} />
            {copy.call.copy}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="section-label text-12 text-accent">{label}</h3>
      <div className="type-body text-15">{children}</div>
    </section>
  );
}
