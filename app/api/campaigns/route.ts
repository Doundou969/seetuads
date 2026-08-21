import { NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { advertiser } = await requireAdvertiser();

    const campaigns = await prisma.campaign.findMany({
      where: { advertiserId: advertiser.id },
      include: {
        campaignScreens: { include: { screen: { select: { name: true, screenCode: true } } } },
        campaignMedia: { include: { media: { select: { name: true, fileType: true } } } },
        payments: { select: { status: true, amount: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(campaigns);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    const { advertiser } = await requireAdvertiser();
    const body = await req.json();

    const {
      name,
      objective,
      startDate,
      endDate,
      spotDuration,
      frequencyPerLoop,
    } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Nom, date de début et date de fin sont requis" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        advertiserId: advertiser.id,
        name,
        objective,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        spotDuration: spotDuration || 15,
        frequencyPerLoop: frequencyPerLoop || 1,
        status: "DRAFT",
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}