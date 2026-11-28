import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { headers } from "next/headers";
import { requireAdvertiser } from "@/lib/permissions";
import AdvertiserMobileNav from "./mobile-nav";

const nav = [
  { href: "/advertiser/dashboard", label: "Tableau de bord" },
  { href: "/advertiser/campaigns", label: "Mes campagnes" },
  { href: "/advertiser/campaigns/new", label: "Nouvelle campagne" },
  { href: "/advertiser/media", label: "Médiathèque" },
];

export default async function AdvertiserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const isPublicAccess =
    headerStore.get("x-seetuads-public-access") === "true";

  if (isPublicAccess) {
    return <>{children}</>;
  }

  let access;

  try {
    access = await requireAdvertiser();
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Accès annonceur
          </h1>

          <p className="mt-3 text-gray-500">
            Vous devez disposer d'un accès annonceur valide.
          </p>

          <Link
            href="/sign-in"
            className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  const { temporary } = access;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4 sm:gap-8">
            <Link
              href="/advertiser/dashboard"
              className="shrink-0 text-lg font-bold text-blue-700 sm:text-xl"
            >
              SeetuAds
            </Link>

            <nav
              aria-label="Navigation annonceur"
              className="hidden items-center gap-1 md:flex"
            >
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <AdvertiserMobileNav />

            {temporary ? (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-700 sm:px-3 sm:text-xs">
                Accès temporaire
              </span>
            ) : (
              <UserButton />
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}