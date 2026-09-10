import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdvertisersDataTable } from "./advertisers-data-table";
import {
Users,
Plus,
Building2,
Megaphone,
Film,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdvertisersPage() {
const advertisers =
await prisma.advertiser.findMany({
orderBy: {
createdAt: "desc",
},
include: {
accessTokens: {
orderBy: {
createdAt: "desc",
},
take: 1,
},
_count: {
select: {
campaigns: true,
media: true,
},
},
},
});

const totalCampaigns = advertisers.reduce(
(total, advertiser) =>
total + advertiser._count.campaigns,
0
);

const totalMedia = advertisers.reduce(
(total, advertiser) =>
total + advertiser._count.media,
0
);

return (
<div className="space-y-6">
{/* Header */}
<div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
<div>
<div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500">
<span>Administration</span>
<span className="text-slate-300">/</span>
<span className="text-blue-600">Annonceurs</span>
</div>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Users className="h-5 w-5" />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Annonceurs
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Gérez vos annonceurs, leurs campagnes et leurs accès.
          </p>
        </div>
      </div>
    </div>

    <Link
      href="/admin/advertisers/new"
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30"
    >
      <Plus className="h-4 w-4" />
      Nouvel annonceur
    </Link>
  </div>

  {/* Statistics */}
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Annonceurs
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {advertisers.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            comptes enregistrés
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Building2 className="h-5 w-5" />
        </div>
      </div>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Campagnes
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {totalCampaigns}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            campagnes associées
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <Megaphone className="h-5 w-5" />
        </div>
      </div>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Médias
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {totalMedia}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            fichiers publicitaires
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Film className="h-5 w-5" />
        </div>
      </div>
    </div>
  </div>

  {/* Table */}
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <AdvertisersDataTable
      advertisers={advertisers.map(
        (advertiser) => {
          const token =
            advertiser.accessTokens[0];

          return {
            id: advertiser.id,
            companyName:
              advertiser.companyName,
            contactName:
              advertiser.contactName,
            email: advertiser.email,
            phone: advertiser.phone,
            city: advertiser.city,
            status:
              String(advertiser.status),
            campaignsCount:
              advertiser._count.campaigns,
            mediaCount:
              advertiser._count.media,
            accessToken: token
              ? {
                  expiresAt:
                    token.expiresAt.toISOString(),
                  revokedAt:
                    token.revokedAt
                      ? token.revokedAt.toISOString()
                      : null,
                  lastUsedAt:
                    token.lastUsedAt
                      ? token.lastUsedAt.toISOString()
                      : null,
                }
              : null,
          };
        }
      )}
    />
  </div>
</div>


);
}