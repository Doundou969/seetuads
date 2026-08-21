import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MediaDataTable } from "./media-data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    include: { advertiser: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medias</h1>
          <p className="text-gray-600">Gerer les images et videos publicitaires</p>
        </div>
        <Link href="/admin/media/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nouveau media
          </Button>
        </Link>
      </div>

      <MediaDataTable
        media={media.map((m) => ({
          id: m.id,
          name: m.name,
          fileUrl: m.fileUrl,
          fileType: m.fileType,
          durationSeconds: m.durationSeconds,
          status: String(m.status),
          advertiser: m.advertiser?.companyName || "-",
        }))}
      />
    </div>
  );
}