import { Suspense } from "react";
import { AccountMenu, AccountMenuFallback } from "@/components/app/account-menu";
import { AppNav } from "@/components/app/app-nav";
import { AppTopBar } from "@/components/app/app-top-bar";
import { FeaturesProvider } from "@/components/app/features";
import { Toaster } from "@/components/ui/toaster";
import { requireUser } from "@/lib/auth/current-user";
import { getAccess } from "@/lib/team/access";
import { signupsOpen } from "@/lib/personal-mode";

export default function DashboardLayout({ children }: LayoutProps<"/painel">) {
  // O que está em pausa fica no código, mas fora da interface.
  const features = { plans: signupsOpen(), googleReviews: Boolean(process.env.GOOGLE_PLACES_API_KEY) };

  return (
    <FeaturesProvider value={features}>
    <div className="flex min-h-dvh flex-1">
      {/* Enquanto se confirma a função, o menu é o do dono; as páginas protegem-se sozinhas. */}
      <Suspense fallback={<AppNav account={<AccountMenuFallback />} />}>
        <RoleNav />
      </Suspense>
      <div className="canvas-grid flex min-w-0 flex-1 flex-col bg-canvas pb-[calc(64px+env(safe-area-inset-bottom)+var(--badge-space))] md:pb-[var(--badge-space)] print:bg-white print:bg-none print:pb-0">
        <AppTopBar />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
      <Toaster />
    </div>
    </FeaturesProvider>
  );
}

async function RoleNav() {
  const { role } = await getAccess();
  return (
    <AppNav
      role={role}
      account={
        <Suspense fallback={<AccountMenuFallback />}>
          <Account />
        </Suspense>
      }
    />
  );
}

async function Account() {
  const user = await requireUser();

  return <AccountMenu email={user.email} />;
}
