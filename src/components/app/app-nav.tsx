"use client";

import { Ellipsis, LogOut, Moon, PanelLeftClose, PanelLeftOpen, Sun } from "lucide-react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { Suspense, useSyncExternalStore, useTransition, type ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/ui/logo";
import { Tooltip } from "@/components/ui/tooltip";
import { NAV_GROUPS, NAV_ITEMS, type NavItem } from "./nav-items";
import { ptPT } from "@/i18n/pt-PT";
import { signOut } from "@/lib/auth/actions";
import { toggleTheme, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const copy = ptPT.app;
const COLLAPSED_KEY = "scoutknock-nav-collapsed";
// No telemóvel, "Mais" leva o que não cabe na barra de baixo.
const MORE_ITEMS = NAV_ITEMS.filter((item) => !item.mobileBar);

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
function NavLink({ item, collapsed, current }: { item: NavItem; collapsed: boolean; current?: string | null }) {
  const { href, segment, label, icon: Icon } = item;
  const active = current === segment;
  const link = (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-12 whitespace-nowrap text-muted transition-colors duration-(--duration-fast) ease-out hovered:bg-surface-raised hovered:text-foreground",
        "md:min-h-10 md:flex-row md:justify-start md:gap-3 md:px-3 md:text-14",
        collapsed && "md:justify-center md:px-0",
        // Ativo: fundo verde suave e um traço dourado à esquerda (só no computador).
        active && "bg-accent-soft font-medium text-foreground hovered:bg-accent-soft hovered:text-foreground [&>svg]:text-accent md:before:absolute md:before:inset-y-2 md:before:left-0 md:before:w-0.5 md:before:rounded-full md:before:bg-gold",
      )}
    >
      <Icon aria-hidden="true" size={19} strokeWidth={1.75} className="shrink-0" />
      <span className={cn(collapsed && "md:sr-only")}>{label}</span>
    </Link>
  );
  return collapsed ? <Tooltip content={label}>{link}</Tooltip> : link;
}

function NavLinks({
  collapsed,
  current,
}: {
  collapsed: boolean;
  current?: string | null;
}) {
  return (
    <>
      {/* Telemóvel: barra de baixo com as páginas do dia a dia e "Mais". */}
      <ul className="flex flex-1 items-center gap-1 md:hidden">
        {NAV_ITEMS.filter((item) => item.mobileBar).map((item) => (
          <li key={item.href} className="flex flex-1">
            <NavLink item={item} collapsed={false} current={current} />
          </li>
        ))}
        <li className="flex flex-1">
          <MoreMenu current={current} />
        </li>
      </ul>
      {/* Computador: os grupos pelo ciclo do trabalho. */}
      <div className="hidden min-h-0 flex-1 flex-col gap-4 overflow-y-auto md:flex">
        {NAV_GROUPS.map((group) => (
          <div key={group.id} role="group" aria-label={group.label ?? undefined} className="flex flex-col gap-0.5">
            {group.label &&
              (collapsed ? (
                <span aria-hidden="true" className="mx-3 mb-1 h-px bg-border" />
              ) : (
                <span aria-hidden="true" className="px-3 pb-1 text-12 font-medium tracking-[0.06em] text-muted uppercase">
                  {group.label}
                </span>
              ))}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <li key={item.href} className="flex">
                  <NavLink item={item} collapsed={collapsed} current={current} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

// No telemóvel, "Mais" junta as outras páginas e o menu da conta (tema e sair).
function MoreMenu({ current }: { current?: string | null }) {
  const active = MORE_ITEMS.some((item) => item.segment === current);
  const theme = useTheme();
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={copy.nav.moreLabel}
        data-testid="nav-more"
        className={cn(
          "focus-ring flex min-h-11 w-full flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-12 whitespace-nowrap text-muted transition-colors duration-(--duration-fast) ease-out hovered:text-foreground",
          active && "bg-accent-soft text-foreground [&>svg]:text-accent",
        )}
      >
        <Ellipsis aria-hidden="true" size={20} strokeWidth={1.75} className="shrink-0" />
        <span>{copy.nav.more}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="max-w-[calc(100vw-16px)]">
        {MORE_ITEMS.map(({ href, segment, label, icon: Icon }) => (
          <DropdownMenuItem key={href} asChild>
            <Link href={href} aria-current={current === segment ? "page" : undefined}>
              <Icon aria-hidden="true" size={16} strokeWidth={1.75} />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {/* O menu fica aberto: vê-se logo o tema novo. */}
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            toggleTheme();
          }}
        >
          {theme === "dark" ? <Sun aria-hidden="true" size={16} strokeWidth={1.75} /> : <Moon aria-hidden="true" size={16} strokeWidth={1.75} />}
          {theme === "dark" ? copy.account.toLight : copy.account.toDark}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={pending} onSelect={() => startTransition(() => signOut())}>
          <LogOut aria-hidden="true" size={16} strokeWidth={1.75} />
          {copy.account.signOut}
        </DropdownMenuItem>
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
        "fixed inset-x-0 bottom-0 z-30 flex items-center gap-1 border-t print:hidden border-border bg-surface px-2 pt-2 pb-[calc(8px+env(safe-area-inset-bottom)+var(--badge-space))]",
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

      {/* No telemóvel, a conta está dentro de "Mais". */}
      <div
        data-collapsed={collapsed || undefined}
        className="group/account hidden md:block md:flex-none"
      >
        {account}
      </div>
    </nav>
  );
}
