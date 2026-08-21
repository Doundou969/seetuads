import { NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { advertiser } = await requireAdvertiser();
    const { id } = await params;

    const media = await prisma.media.findFirst({
      where: { id, advertiserId: advertiser.id },
    });

    if (!media) {
      return NextResponse.json({ error: "Média non trouvé" }, { status: 404 });
    }

    await prisma.media.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}