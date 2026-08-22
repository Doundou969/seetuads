import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CampaignsDataTable } from "./campaigns-data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      advertiser: true,
      campaignScreens: true,
      campaignMedia: true,
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Campagnes
          </h1>
          <p className="text-gray-600">
            Gerer les campagnes publicitaires
          </p>
        </div>

        <Link href="/admin/campaigns/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle campagne
          </Button>
        </Link>
      </div>

      <CampaignsDataTable
        campaigns={campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          advertiser: c.advertiser?.companyName || "-",
          screensCount: c.campaignScreens.length,
          mediaCount: c.campaignMedia.length,
          startDate: c.startDate.toLocaleDateString("fr-FR"),
          endDate: c.endDate.toLocaleDateString("fr-FR"),
          estimatedPrice: c.estimatedPrice?.toString() || "0",
          status: String(c.status),
        }))}
      />
    </div>
  );
}