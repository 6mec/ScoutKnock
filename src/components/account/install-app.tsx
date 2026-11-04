"use client";

import { MonitorSmartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PanelHeader } from "@/components/ui/panel-header";
import { ptPT } from "@/i18n/pt-PT";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const { install: copy } = ptPT;

// Só aparece quando o browser oferece a instalação: nada é anunciado sem funcionar.
export function InstallApp({ className }: { className?: string }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!prompt && !installed) return null;

  return (
    <section aria-labelledby="account-install" className={className}>
      <PanelHeader
        id="account-install"
        icon={MonitorSmartphone}
        title={copy.title}
        description={installed ? copy.done : copy.body}
      />
      {prompt && (
        <Button
          variant="secondary"
          className="self-start"
          onClick={async () => {
            await prompt.prompt();
            await prompt.userChoice;
            setPrompt(null);
          }}
        >
          {copy.action}
        </Button>
      )}
    </section>
  );
}
