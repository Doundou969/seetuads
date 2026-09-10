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
    </div>
  );
}