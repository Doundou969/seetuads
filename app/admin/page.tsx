import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [
    usersCount,
    advertisersCount,
    campaignsCount,
    mediaCount,
    screensCount,
    partnersCount,
    locationsCount,
    playersCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.advertiser.count(),
    prisma.campaign.count(),
    prisma.media.count(),
    prisma.screen.count(),
    prisma.partner.count(),
    prisma.location.count(),
    prisma.player.count(),
  ]);

  const stats = [
    {
      label: "Utilisateurs",
      value: usersCount,
      description: "Comptes enregistrés",
    },
    {
      label: "Annonceurs",
      value: advertisersCount,
      description: "Annonceurs actifs",
    },
    {
      label: "Campagnes",
      value: campaignsCount,
      description: "Campagnes créées",
    },
    {
      label: "Médias",
      value: mediaCount,
      description: "Images et vidéos",
    },
    {
      label: "Écrans",
      value: screensCount,
      description: "Écrans enregistrés",
    },
    {
      label: "Partenaires",
      value: partnersCount,
      description: "Partenaires enregistrés",
    },
    {
      label: "Emplacements",
      value: locationsCount,
      description: "Emplacements configurés",
    },
    {
      label: "Players",
      value: playersCount,
      description: "Players connectés",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Tableau de bord
        </h1>

        <p className="mt-2 text-gray-600">
          Vue d'ensemble de votre plateforme SeetuAds.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">
              {stat.label}
            </p>

            <p className="mt-3 text-3xl font-bold text-gray-900">
              {stat.value}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              {stat.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}