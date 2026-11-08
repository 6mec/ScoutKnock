"use client";

import { CreditCard, Globe, LogOut, Moon, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeatures } from "@/components/app/features";
import { ptPT } from "@/i18n/pt-PT";
import { signOut } from "@/lib/auth/actions";
import { toggleTheme, useTheme } from "@/lib/theme";

const copy = ptPT.app.account;

export function AccountMenu({ email }: { email: string }) {
  const [pending, startTransition] = useTransition();
  const theme = useTheme();
  const { plans } = useFeatures();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="focus-ring flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-md text-12 text-muted transition-colors duration-(--duration-fast) ease-out hovered:text-foreground md:flex-row md:justify-start md:gap-3 md:px-1 md:text-14 md:group-data-collapsed/account:justify-center md:group-data-collapsed/account:px-0"
      >
        <span aria-hidden="true" className="inline-flex">
          <Avatar
            alt=""
            initials={email.charAt(0).toUpperCase()}
            className="size-6 md:size-8"
          />
        </span>
        <span className="md:sr-only">{copy.label}</span>
        <span className="hidden min-w-0 truncate md:block md:group-data-collapsed/account:hidden">
          {email}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="max-w-[calc(100vw-16px)]">
        <DropdownMenuLabel className="break-all">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/painel/conta">
            <UserRound aria-hidden="true" size={16} strokeWidth={1.75} />
            {copy.label}
          </Link>
        </DropdownMenuItem>
        {plans && (
          <DropdownMenuItem asChild>
            <Link href="/painel/planos">
              <CreditCard aria-hidden="true" size={16} strokeWidth={1.75} />
              {copy.plans}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/">
            <Globe aria-hidden="true" size={16} strokeWidth={1.75} />
            {copy.viewSite}
          </Link>
        </DropdownMenuItem>
        {/* O menu fica aberto: vê-se logo o tema novo. */}
        <DropdownMenuItem onSelect={(event) => { event.preventDefault(); toggleTheme(); }} data-testid="theme-toggle">
          {theme === "dark" ? <Sun aria-hidden="true" size={16} strokeWidth={1.75} /> : <Moon aria-hidden="true" size={16} strokeWidth={1.75} />}
          {theme === "dark" ? copy.toLight : copy.toDark}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pending}
          onSelect={() => startTransition(() => signOut())}
        >
          <LogOut aria-hidden="true" size={16} strokeWidth={1.75} />
          {copy.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AccountMenuFallback() {
  return (
    <div className="flex min-h-11 items-center justify-center md:justify-start md:px-1">
      <Skeleton className="size-6 rounded-pill md:size-8" />
    </div>
  );
}
