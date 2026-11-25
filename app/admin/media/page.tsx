import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MediaDataTable } from "./media-data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      advertiser: true,
      partner: true,
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Médias
          </h1>
          <p className="text-gray-600">
            Gérer les médias des annonceurs et des partenaires
          </p>
        </div>

        <Link href="/admin/media/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau média
          </Button>
        </Link>
      </div>

      <MediaDataTable
        media={media.map((item) => ({
          id: item.id,
          name: item.name,
          fileUrl: item.fileUrl,
          fileType: item.fileType,
          durationSeconds: item.durationSeconds,
          status: String(item.status),
          owner: item.partner
            ? `Partenaire — ${item.partner.businessName}`
            : item.advertiser
              ? `Annonceur — ${item.advertiser.companyName}`
              : "Propriétaire inconnu",
        }))}
      />
    </div>
  );
}