import { Suspense } from "react";
import { AccountMenu, AccountMenuFallback } from "@/components/app/account-menu";
import { AppNav } from "@/components/app/app-nav";
import { AppTopBar } from "@/components/app/app-top-bar";
import { requireUser } from "@/lib/auth/current-user";

export default function DashboardLayout({ children }: LayoutProps<"/painel">) {
  return (
    <div className="flex min-h-dvh flex-1">
      <AppNav
        account={
          <Suspense fallback={<AccountMenuFallback />}>
            <Account />
          </Suspense>
        }
      />
      <div className="canvas-grid flex min-w-0 flex-1 flex-col bg-canvas pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
        <AppTopBar />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}

async function Account() {
  const user = await requireUser();

  return <AccountMenu email={user.email} />;
}
