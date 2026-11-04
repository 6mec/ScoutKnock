"use client";

import {
  BriefcaseBusiness,
  ClipboardList,
  Ellipsis,
  FolderKanban,
  Globe,
  House,
  PanelLeftClose,
  PanelLeftOpen,
  Radar,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { Suspense, useSyncExternalStore, type ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/ui/logo";
import { Tooltip } from "@/components/ui/tooltip";
import { ptPT } from "@/i18n/pt-PT";
import { cn } from "@/lib/utils";

const copy = ptPT.app;
const COLLAPSED_KEY = "scoutknock-nav-collapsed";
const NAV_ITEMS = [
  { href: "/painel", segment: null, label: copy.nav.home, icon: House },
  { href: "/painel/radar", segment: "radar", label: copy.nav.radar, icon: Radar },
  { href: "/painel/projetos", segment: "projetos", label: copy.nav.projects, icon: FolderKanban },
  { href: "/painel/contactos", segment: "contactos", label: copy.nav.contacts, icon: Users },
  // No telemóvel, a barra não tem espaço: o portfólio e os pedidos passam para "Mais".
  { href: "/painel/portfolio", segment: "portfolio", label: copy.nav.portfolio, icon: BriefcaseBusiness, desktopOnly: true },
  { href: "/painel/pedidos", segment: "pedidos", label: copy.nav.requests, icon: ClipboardList, desktopOnly: true },
] as const;

// "Mais": as demos (já não são o caminho principal) e, no telemóvel, o que não cabe na barra.
const MORE_ITEMS = [
  { href: "/painel/portfolio", segment: "portfolio", label: copy.nav.portfolio, icon: BriefcaseBusiness, mobileOnly: true },
  { href: "/painel/pedidos", segment: "pedidos", label: copy.nav.requests, icon: ClipboardList, mobileOnly: true },
  { href: "/painel/demos", segment: "demos", label: copy.nav.demos, icon: Globe, mobileOnly: false },
] as const;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// O menu recolhido é só uma preferência: sem armazenamento, fica aberto.
function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    return;
  }
  listeners.forEach((listener) => listener());
}

function ActiveNavLinks({ collapsed }: { collapsed: boolean }) {
  return <NavLinks collapsed={collapsed} current={useSelectedLayoutSegment()} />;
}

// Enquanto o segmento não é conhecido (current undefined), nenhuma ligação fica ativa.
function NavLinks({
  collapsed,
  current,
}: {
  collapsed: boolean;
  current?: string | null;
}) {
  return (
    <ul className="flex flex-4 items-center gap-1 md:flex-1 md:flex-col md:items-stretch">
      {NAV_ITEMS.map((item) => {
        const { href, segment, label, icon: Icon } = item;
        const desktopOnly = "desktopOnly" in item && item.desktopOnly;
        const active = current === segment;
        const link = (
          <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-ring flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-12 whitespace-nowrap text-muted transition-colors duration-(--duration-fast) ease-out hovered:text-foreground",
              "md:flex-row md:justify-start md:gap-3 md:px-3 md:text-14",
              collapsed && "md:justify-center md:px-0",
              active && "bg-accent-soft text-accent hovered:text-accent",
            )}
          >
            <Icon aria-hidden="true" size={20} strokeWidth={1.75} className="shrink-0" />
            <span className={cn(collapsed && "md:sr-only")}>{label}</span>
          </Link>
        );

        return (
          <li key={href} className={cn("flex flex-1 md:flex-none", desktopOnly && "hidden md:flex")}>
            {collapsed ? <Tooltip content={label}>{link}</Tooltip> : link}
          </li>
        );
      })}
      <li className="flex flex-1 md:flex-none">
        <MoreMenu collapsed={collapsed} current={current} />
      </li>
    </ul>
  );
}

function MoreMenu({ collapsed, current }: { collapsed: boolean; current?: string | null }) {
  const onDesktop = MORE_ITEMS.some((item) => !item.mobileOnly && item.segment === current);
  const onMobile = MORE_ITEMS.some((item) => item.segment === current);
  const trigger = (
    <DropdownMenuTrigger
      aria-label={copy.nav.moreLabel}
      data-testid="nav-more"
      className={cn(
        "focus-ring flex min-h-11 w-full flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-12 whitespace-nowrap text-muted transition-colors duration-(--duration-fast) ease-out hovered:text-foreground",
        "md:flex-row md:justify-start md:gap-3 md:px-3 md:text-14",
        collapsed && "md:justify-center md:px-0",
        onMobile && "max-md:bg-accent-soft max-md:text-accent",
        onDesktop && "md:bg-accent-soft md:text-accent",
      )}
    >
      <Ellipsis aria-hidden="true" size={20} strokeWidth={1.75} className="shrink-0" />
      <span className={cn(collapsed && "md:sr-only")}>{copy.nav.more}</span>
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu>
      {collapsed ? <Tooltip content={copy.nav.more}>{trigger}</Tooltip> : trigger}
      <DropdownMenuContent side="top" align="end" className="max-w-[calc(100vw-16px)]">
        {MORE_ITEMS.map(({ href, segment, label, icon: Icon, mobileOnly }) => (
          <DropdownMenuItem key={href} asChild className={cn(mobileOnly && "md:hidden")}>
            <Link href={href} aria-current={current === segment ? "page" : undefined}>
              <Icon aria-hidden="true" size={16} strokeWidth={1.75} />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Um só menu: barra inferior no telemóvel, coluna lateral a partir de 768 px.
export function AppNav({ account }: { account: ReactNode }) {
    const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <nav
      aria-label={copy.nav.label}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 flex items-center gap-1 border-t print:hidden border-border bg-surface px-2 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))]",
        "md:sticky md:top-0 md:h-dvh md:shrink-0 md:flex-col md:items-stretch md:gap-2 md:border-t-0 md:border-r md:px-3 md:py-5",
        "md:transition-[width] md:duration-(--duration-base) md:ease-out",
        collapsed ? "md:w-16" : "md:w-58",
      )}
    >
      <Link
        href="/painel"
        aria-label={copy.nav.homeLogo}
        className="focus-ring mb-4 hidden h-11 items-center overflow-hidden rounded-sm px-1 md:flex"
      >
        <Logo showWordmark={!collapsed} size={collapsed ? 32 : 28} />
      </Link>

      <Suspense fallback={<NavLinks collapsed={collapsed} />}>
        <ActiveNavLinks collapsed={collapsed} />
      </Suspense>

      <button
        type="button"
        aria-expanded={!collapsed}
        aria-label={collapsed ? copy.nav.expand : copy.nav.collapse}
        onClick={() => writeCollapsed(!collapsed)}
        className={cn(
          "focus-ring hidden min-h-11 items-center rounded-md px-3 text-muted transition-colors duration-(--duration-fast) ease-out hovered:text-foreground md:flex",
          collapsed && "justify-center px-0",
        )}
      >
        <ToggleIcon aria-hidden="true" size={20} strokeWidth={1.75} />
      </button>

      <div
        data-collapsed={collapsed || undefined}
        className="group/account flex-1 md:flex-none"
      >
        {account}
      </div>
    </nav>
  );
}
