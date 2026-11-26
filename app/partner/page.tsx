import Link from "next/link";
import { requirePartner } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import PartnerSignOut from "./PartnerSignOut";

export const dynamic = "force-dynamic";

export default async function PartnerDashboardPage() {
  const { partner } = await requirePartner();

  const [locationsCount, screensCount, activeScreensCount] =
    await Promise.all([
      prisma.location.count({
        where: { partnerId: partner.id },
      }),
      prisma.screen.count({
        where: {
          location: {
            partnerId: partner.id,
          },
        },
      }),
      prisma.screen.count({
        where: {
          location: {
            partnerId: partner.id,
          },
          status: "ONLINE",
        },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Bonjour, {partner.ownerName || partner.businessName}
          </h1>
          <p className="text-muted-foreground">
            Bienvenue dans votre espace partenaire SeetuAds.
          </p>
        </div>

        <PartnerSignOut />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Emplacements</p>
          <p className="mt-2 text-3xl font-bold">{locationsCount}</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Écrans</p>
          <p className="mt-2 text-3xl font-bold">{screensCount}</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Écrans actifs</p>
          <p className="mt-2 text-3xl font-bold">{activeScreensCount}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Mes écrans</h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            Ajoutez un écran à l’un de vos emplacements avec sa référence.
          </p>

          <Link
            href="/partner/screens"
            className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            style={{ color: "#fff" }}
          >
            Gérer mes écrans
          </Link>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Médias du partenaire</h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            Ajoutez et consultez les images et vidéos de votre compte.
          </p>

          <Link
            href="/partner/media"
            className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            style={{ color: "#fff" }}
          >
            Gérer mes médias
          </Link>
        </div>
      </div>
    </div>
  );
}