import { NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

async function checkCampaignAccess(campaignId: string, advertiserId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, advertiserId },
  });
  return campaign;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { advertiser } = await requireAdvertiser();
    const { id } = await params;

    const campaign = await prisma.campaign.findFirst({
      where: { id, advertiserId: advertiser.id },
      include: {
        campaignScreens: {
          include: { screen: { select: { id: true, name: true, screenCode: true, status: true } } },
        },
        campaignMedia: {
          include: { media: { select: { id: true, name: true, fileUrl: true, fileType: true, durationSeconds: true } } },
          orderBy: { displayOrder: "asc" },
        },
        payments: true,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { advertiser } = await requireAdvertiser();
    const { id } = await params;

    const campaign = await checkCampaignAccess(id, advertiser.id);
    if (!campaign) {
      return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
    }

    // On ne modifie que si DRAFT ou PENDING_REVIEW
    if (campaign.status !== "DRAFT" && campaign.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        { error: "Impossible de modifier une campagne en cours ou terminée" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      name,
      objective,
      startDate,
      endDate,
      spotDuration,
      frequencyPerLoop,
      status,
    } = body;

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(objective !== undefined && { objective }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(spotDuration && { spotDuration }),
        ...(frequencyPerLoop && { frequencyPerLoop }),
        ...(status && { status }),
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { advertiser } = await requireAdvertiser();
    const { id } = await params;

    const campaign = await checkCampaignAccess(id, advertiser.id);
    if (!campaign) {
      return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
    }

    if (campaign.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Seules les campagnes en brouillon peuvent être supprimées" },
        { status: 400 }
      );
    }

    await prisma.campaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}