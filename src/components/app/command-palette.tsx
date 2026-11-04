"use client";

import { Command } from "cmdk";
import {
  BriefcaseBusiness,
  ClipboardList,
  CreditCard,
  FolderKanban,
  Globe,
  House,
  Radar,
  Search,
  SunMoon,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Kbd } from "@/components/ui/kbd";
import { ptPT } from "@/i18n/pt-PT";
import { requestNewSearch } from "@/lib/radar/new-search";
import { toggleTheme } from "@/lib/theme";

const copy = ptPT.app.commands;
const COMMANDS: {
  label: string;
  href?: string;
  icon: LucideIcon;
  onSelect?: () => void;
}[] = [
  { label: copy.newSearch, href: "/painel/radar", icon: Search, onSelect: requestNewSearch },
  { label: copy.goHome, href: "/painel", icon: House },
  { label: copy.goRadar, href: "/painel/radar", icon: Radar },
  { label: copy.goProjects, href: "/painel/projetos", icon: FolderKanban },
  { label: copy.goDemos, href: "/painel/demos", icon: Globe },
  { label: copy.goContacts, href: "/painel/contactos", icon: Users },
  { label: copy.goPortfolio, href: "/painel/portfolio", icon: BriefcaseBusiness },
  { label: copy.goRequests, href: "/painel/pedidos", icon: ClipboardList },
  { label: copy.goPlans, href: "/painel/planos", icon: CreditCard },
  { label: copy.goAccount, href: "/painel/conta", icon: UserRound },
  { label: copy.toggleTheme, icon: SunMoon, onSelect: toggleTheme },
];

const subscribeToNothing = () => () => {};

function isMac() {
  return /mac|iphone|ipad/i.test(navigator.userAgent);
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const mac = useSyncExternalStore(subscribeToNothing, isMac, () => false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-keyshortcuts="Control+K Meta+K"
        onClick={() => setOpen(true)}
        className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center gap-3 rounded-md border border-border bg-surface px-3 text-14 text-muted transition-colors duration-(--duration-fast) ease-out hovered:text-foreground"
      >
        <Search aria-hidden="true" size={16} strokeWidth={1.75} />
        <span className="sr-only sm:not-sr-only">{copy.trigger}</span>
        <Kbd aria-hidden="true" className="hidden sm:inline-flex">
          {mac ? "⌘K" : "Ctrl K"}
        </Kbd>
      </button>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label={copy.label}
        overlayClassName="fixed inset-0 z-40 bg-canvas/80 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in"
        contentClassName="fixed inset-x-4 top-[15dvh] z-50 mx-auto max-w-lg overflow-hidden rounded-lg border border-border bg-surface-raised shadow-float data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in"
      >
        <Command.Input
          placeholder={copy.placeholder}
          className="h-13 w-full border-b border-border bg-transparent px-4 text-16 text-foreground outline-none placeholder:text-muted"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-muted">
            {copy.empty}
          </Command.Empty>
          {COMMANDS.map(({ label, href, icon: Icon, onSelect }) => (
            <Command.Item
              key={label}
              value={label}
              onSelect={() => {
                setOpen(false);
                onSelect?.();
                if (href) router.push(href);
              }}
              className="flex min-h-11 cursor-default items-center gap-3 rounded-sm px-3 data-[selected=true]:bg-accent-soft"
            >
              <Icon aria-hidden="true" size={16} strokeWidth={1.75} className="text-muted" />
              {label}
            </Command.Item>
          ))}
        </Command.List>
      </Command.Dialog>
    </>
  );
}
