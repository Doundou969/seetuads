import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdvertisersDataTable } from "./advertisers-data-table";

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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Annonceurs
          </h1>

          <p className="mt-1 text-gray-600">
            Gérer les annonceurs et leurs accès temporaires.
          </p>
        </div>

        <Link
          href="/admin/advertisers/new"
          className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Nouvel annonceur
        </Link>
      </div>

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
  );
}
