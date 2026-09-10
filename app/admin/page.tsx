import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
      color: "blue",
    },
    {
      label: "Annonceurs",
      value: advertisersCount,
      description: "Comptes annonceurs",
      color: "violet",
    },
    {
      label: "Campagnes",
      value: campaignsCount,
      description: "Campagnes créées",
      color: "emerald",
    },
    {
      label: "Médias",
      value: mediaCount,
      description: "Images et vidéos",
      color: "orange",
    },
    {
      label: "Écrans",
      value: screensCount,
      description: "Écrans enregistrés",
      color: "cyan",
    },
    {
      label: "Partenaires",
      value: partnersCount,
      description: "Partenaires enregistrés",
      color: "pink",
    },
    {
      label: "Emplacements",
      value: locationsCount,
      description: "Emplacements configurés",
      color: "indigo",
    },
    {
      label: "Players",
      value: playersCount,
      description: "Players connectés",
      color: "green",
    },
  ];

  return (
    <div className="space-y-7">
      <section className="dashboard-welcome">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-3 inline-flex items-center rounded-full border border-blue-300/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100 backdrop-blur">
            SEETUADS · ADMINISTRATION
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Tableau de bord
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 sm:text-base">
            Pilotez vos annonceurs, campagnes, médias et infrastructures
            depuis un espace centralisé.
          </p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Vue d'ensemble
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Les indicateurs principaux de votre plateforme.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="kpi-card">
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <p className="kpi-label">{stat.label}</p>

                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      stat.color === "blue"
                        ? "bg-blue-500"
                        : stat.color === "violet"
                          ? "bg-violet-500"
                          : stat.color === "emerald"
                            ? "bg-emerald-500"
                            : stat.color === "orange"
                              ? "bg-orange-500"
                              : stat.color === "cyan"
                                ? "bg-cyan-500"
                                : stat.color === "pink"
                                  ? "bg-pink-500"
                                  : stat.color === "indigo"
                                    ? "bg-indigo-500"
                                    : "bg-green-500"
                    }`}
                  />
                </div>

                <p className="kpi-value">{stat.value}</p>

                <p className="kpi-description">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Actions rapides
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Nouveau player
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Enregistrer un appareil de lecture pour un ecran.
                </p>
              </div>

              <Link href="/admin/players/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nouveau player
                </Button>
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Nouvel ecran
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Enregistrer un nouvel ecran d'affichage.
                </p>
              </div>

              <Link href="/admin/screens/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nouvel ecran
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <span className="text-lg font-bold">S</span>
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Plateforme SeetuAds
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Gérez votre réseau publicitaire digital, vos écrans,
                vos campagnes et vos partenaires depuis cet espace.
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <span className="text-lg font-bold">✓</span>
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Infrastructure opérationnelle
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Consultez les statistiques, surveillez vos players et
                gardez le contrôle sur votre inventaire publicitaire.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
