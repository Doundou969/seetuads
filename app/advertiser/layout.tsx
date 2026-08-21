import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { headers } from "next/headers";
import { requireAdvertiser } from "@/lib/permissions";

const nav = [
  { href: "/advertiser/dashboard", label: "Tableau de bord" },
  { href: "/advertiser/campaigns", label: "Mes campagnes" },
  { href: "/advertiser/campaigns/new", label: "+ Nouvelle campagne" },
  { href: "/advertiser/media", label: "Médiathèque" },
];

export default async function AdvertiserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();

  const pathname =
    headerStore.get("x-seetuads-public-access") === "true";

  if (pathname) {
    return <>{children}</>;
  }

  let access;

  try {
    access = await requireAdvertiser();
  } catch {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
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
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link
              href="/advertiser/dashboard"
              className="text-xl font-bold text-blue-700"
            >
              SeetuAds
            </Link>

            <nav className="hidden gap-1 md:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {temporary ? (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Accès temporaire
            </span>
          ) : (
            <UserButton />
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}
